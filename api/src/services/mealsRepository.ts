/**
 * Repository pattern for Meals data access
 * Following Single Responsibility and Dependency Inversion principles
 */
import { TableClient } from '@azure/data-tables';
import type { Meal, DailyStats } from '../types/food.js';

export interface IMealsRepository {
  saveMeal(meal: Meal): Promise<Meal>;
  getMealsByDate(userId: string, date: string): Promise<Meal[]>;
  getMealById(userId: string, date: string, mealId: string): Promise<Meal | null>;
  updateMeal(meal: Meal): Promise<Meal>;
  deleteMeal(userId: string, date: string, mealId: string): Promise<void>;
  getDailyStats(userId: string, date: string): Promise<DailyStats>;
  listPatientSummaries(limit?: number): Promise<AdminPatientSummary[]>;
}

export interface AdminPatientSummary {
  userId: string;
  mealsCount: number;
  lastMealAt?: string;
}

export class MealsRepository implements IMealsRepository {
  private tableClient: TableClient;

  constructor(connectionString: string, tableName = 'Meals') {
    this.tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }

  private toEntity(meal: Meal) {
    return {
      partitionKey: meal.PartitionKey,
      rowKey: meal.RowKey,
      userId: meal.userId,
      mealType: meal.mealType,
      photoUrl: meal.photoUrl,
      items: JSON.stringify(meal.items ?? []),
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalFat: meal.totalFat,
      totalCarbs: meal.totalCarbs,
      confirmed: meal.confirmed ?? false,
      createdAt: meal.createdAt ?? new Date().toISOString(),
      confirmedAt: meal.confirmedAt
    };
  }

  private fromEntity(entity: Record<string, unknown>): Meal {
    const partitionKey = (entity.partitionKey ?? entity.PartitionKey) as string;
    const rowKey = (entity.rowKey ?? entity.RowKey) as string;

    return {
      PartitionKey: String(partitionKey ?? ''),
      RowKey: String(rowKey ?? ''),
      userId: String(entity.userId ?? ''),
      mealType: entity.mealType as Meal['mealType'],
      photoUrl: entity.photoUrl as string | undefined,
      items: entity.items ? JSON.parse(entity.items as string) : [],
      totalCalories: Number(entity.totalCalories ?? 0),
      totalProtein: Number(entity.totalProtein ?? 0),
      totalFat: Number(entity.totalFat ?? 0),
      totalCarbs: Number(entity.totalCarbs ?? 0),
      confirmed: Boolean(entity.confirmed ?? false),
      createdAt: String(entity.createdAt ?? new Date().toISOString()),
      confirmedAt: entity.confirmedAt ? String(entity.confirmedAt) : undefined
    };
  }

  async saveMeal(meal: Meal): Promise<Meal> {
    const entity = this.toEntity(meal);
    await this.tableClient.createEntity(entity);
    return {
      ...meal,
      createdAt: entity.createdAt,
      confirmed: entity.confirmed
    };
  }

  async getMealsByDate(userId: string, date: string): Promise<Meal[]> {
    const partitionKey = `${userId}_${date}`;
    const entities = this.tableClient.listEntities({
      queryOptions: { filter: `PartitionKey eq '${partitionKey}'` }
    });

    const meals: Meal[] = [];
    for await (const entity of entities) {
      meals.push(this.fromEntity(entity as Record<string, unknown>));
    }

    return meals.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async getMealById(userId: string, date: string, mealId: string): Promise<Meal | null> {
    try {
      const partitionKey = `${userId}_${date}`;
      const entity = await this.tableClient.getEntity(partitionKey, mealId);
      return this.fromEntity(entity as Record<string, unknown>);
    } catch (error) {
      return null;
    }
  }

  async updateMeal(meal: Meal): Promise<Meal> {
    const entity = this.toEntity(meal);
    await this.tableClient.updateEntity(entity as any, 'Merge');
    return {
      ...meal,
      createdAt: entity.createdAt,
      confirmed: entity.confirmed
    };
  }

  async deleteMeal(userId: string, date: string, mealId: string): Promise<void> {
    const partitionKey = `${userId}_${date}`;
    await this.tableClient.deleteEntity(partitionKey, mealId);
  }

  async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    const meals = await this.getMealsByDate(userId, date);
    
    const confirmedMeals = meals.filter(m => m.confirmed);
    
    const stats: DailyStats = {
      date,
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      mealsCount: confirmedMeals.length
    };

    confirmedMeals.forEach(meal => {
      stats.totalCalories += meal.totalCalories;
      stats.totalProtein += meal.totalProtein;
      stats.totalFat += meal.totalFat;
      stats.totalCarbs += meal.totalCarbs;
    });

    return stats;
  }

  async listPatientSummaries(limit = 200): Promise<AdminPatientSummary[]> {
    const entities = this.tableClient.listEntities({
      queryOptions: { select: ['userId', 'createdAt'] }
    });

    const map = new Map<string, AdminPatientSummary>();

    for await (const entity of entities) {
      const userId = String((entity as any).userId ?? '').trim();
      if (!userId) continue;

      const createdAt = String((entity as any).createdAt ?? '').trim();
      const existing = map.get(userId);

      if (existing) {
        existing.mealsCount += 1;
        if (createdAt) {
          const prev = existing.lastMealAt ? new Date(existing.lastMealAt).getTime() : 0;
          const next = new Date(createdAt).getTime();
          if (!Number.isNaN(next) && next > prev) {
            existing.lastMealAt = createdAt;
          }
        }
      } else {
        map.set(userId, {
          userId,
          mealsCount: 1,
          lastMealAt: createdAt || undefined
        });
      }
    }

    const summaries = Array.from(map.values()).sort((a, b) => {
      const aTime = a.lastMealAt ? new Date(a.lastMealAt).getTime() : 0;
      const bTime = b.lastMealAt ? new Date(b.lastMealAt).getTime() : 0;
      return bTime - aTime;
    });

    return summaries.slice(0, limit);
  }
}
