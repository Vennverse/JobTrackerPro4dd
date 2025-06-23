import { db } from "./db";
import { users, dailyUsage } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Daily usage limits for free vs pro users
export const USAGE_LIMITS = {
  free: {
    jobAnalyses: 5,
    resumeAnalyses: 2,
    applications: 10,
    autoFills: 15,
  },
  pro: {
    jobAnalyses: -1, // unlimited
    resumeAnalyses: -1, // unlimited
    applications: -1, // unlimited
    autoFills: -1, // unlimited
  },
};

export class SubscriptionService {
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async getUserSubscription(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return {
      planType: user?.planType || 'free',
      subscriptionStatus: user?.subscriptionStatus || 'free',
      isProUser: user?.planType === 'pro' && user?.subscriptionStatus === 'active',
    };
  }

  async getDailyUsage(userId: string, date?: string) {
    const targetDate = date || this.getTodayDate();
    
    const [usage] = await db
      .select()
      .from(dailyUsage)
      .where(and(
        eq(dailyUsage.userId, userId),
        eq(dailyUsage.date, targetDate)
      ));

    return usage || {
      jobAnalysesCount: 0,
      resumeAnalysesCount: 0,
      applicationsCount: 0,
      autoFillUsageCount: 0,
    };
  }

  async canUseFeature(userId: string, feature: keyof typeof USAGE_LIMITS.free): Promise<{
    canUse: boolean;
    remainingUsage: number;
    upgradeRequired: boolean;
    resetTime: string;
  }> {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getDailyUsage(userId);
    
    // Premium users have unlimited access
    if (subscription.planType === 'premium') {
      return {
        canUse: true,
        remainingUsage: -1, // unlimited
        upgradeRequired: false,
        resetTime: '',
      };
    }

    const limit = USAGE_LIMITS.free[feature];
    const usageKey = feature === 'autoFills' ? 'autoFillsCount' : `${feature}Count`;
    const currentUsage = usage[usageKey as keyof typeof usage] as number || 0;
    const remaining = Math.max(0, limit - currentUsage);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      canUse: remaining > 0,
      remainingUsage: remaining,
      upgradeRequired: remaining === 0,
      resetTime: tomorrow.toISOString(),
    };
  }

  async incrementUsage(userId: string, feature: keyof typeof USAGE_LIMITS.free) {
    const today = this.getTodayDate();
    
    // Get or create today's usage record
    const [existingUsage] = await db
      .select()
      .from(dailyUsage)
      .where(and(
        eq(dailyUsage.userId, userId),
        eq(dailyUsage.date, today)
      ));

    const featureColumn = `${feature}Count` as keyof typeof USAGE_LIMITS.free;
    
    if (existingUsage) {
      // Update existing record
      const updateData = {
        [featureColumn]: (existingUsage[featureColumn as keyof typeof existingUsage] as number || 0) + 1,
        updatedAt: new Date(),
      };
      
      await db
        .update(dailyUsage)
        .set(updateData)
        .where(eq(dailyUsage.id, existingUsage.id));
    } else {
      // Create new record
      const insertData = {
        userId,
        date: today,
        jobAnalysesCount: feature === 'jobAnalyses' ? 1 : 0,
        resumeAnalysesCount: feature === 'resumeAnalyses' ? 1 : 0,
        applicationsCount: feature === 'applications' ? 1 : 0,
        autoFillsCount: feature === 'autoFills' ? 1 : 0,
      };
      
      await db.insert(dailyUsage).values(insertData);
    }
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    paypalOrderId?: string;
    subscriptionStatus?: string;
    planType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }) {
    await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUsageStats(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getDailyUsage(userId);
    
    const limits = subscription.isProUser ? USAGE_LIMITS.pro : USAGE_LIMITS.free;
    
    return {
      planType: subscription.planType,
      isProUser: subscription.isProUser,
      usage: {
        jobAnalyses: {
          used: usage.jobAnalysesCount || 0,
          limit: limits.jobAnalyses,
          remaining: limits.jobAnalyses === -1 ? -1 : Math.max(0, limits.jobAnalyses - (usage.jobAnalysesCount || 0)),
        },
        resumeAnalyses: {
          used: usage.resumeAnalysesCount || 0,
          limit: limits.resumeAnalyses,
          remaining: limits.resumeAnalyses === -1 ? -1 : Math.max(0, limits.resumeAnalyses - (usage.resumeAnalysesCount || 0)),
        },
        applications: {
          used: usage.applicationsCount || 0,
          limit: limits.applications,
          remaining: limits.applications === -1 ? -1 : Math.max(0, limits.applications - (usage.applicationsCount || 0)),
        },
        autoFills: {
          used: usage.autoFillsCount || 0,
          limit: limits.autoFills,
          remaining: limits.autoFills === -1 ? -1 : Math.max(0, limits.autoFills - (usage.autoFillsCount || 0)),
        },
      },
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    };
  }
}

export const subscriptionService = new SubscriptionService();