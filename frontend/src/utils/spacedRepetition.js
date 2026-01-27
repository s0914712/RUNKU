/**
 * SM-2 (SuperMemo 2) 間隔重複演算法
 * 根據使用者的回答品質計算下次複習時間
 */

export const FAMILIARITY_LEVELS = {
  UNKNOWN: 0,      // 完全不認識
  HARD: 1,         // 想不起來/困難
  GOOD: 2,         // 想起來但有點費力
  EASY: 3,         // 輕鬆想起來
  PERFECT: 4,      // 完全精通
};

export const calculateNextReview = (familiarity, reviewCount, lastInterval = 1) => {
  let interval;
  
  switch (familiarity) {
    case FAMILIARITY_LEVELS.UNKNOWN:
    case FAMILIARITY_LEVELS.HARD:
      // 重新開始
      interval = 0.25; // 6小時後
      break;
    
    case FAMILIARITY_LEVELS.GOOD:
      if (reviewCount === 0) {
        interval = 1; // 1天
      } else if (reviewCount === 1) {
        interval = 3; // 3天
      } else {
        interval = lastInterval * 1.5; // 漸進增長
      }
      break;
    
    case FAMILIARITY_LEVELS.EASY:
      if (reviewCount === 0) {
        interval = 3; // 3天
      } else if (reviewCount === 1) {
        interval = 7; // 1週
      } else {
        interval = lastInterval * 2; // 倍增
      }
      break;
    
    case FAMILIARITY_LEVELS.PERFECT:
      if (reviewCount === 0) {
        interval = 7; // 1週
      } else {
        interval = lastInterval * 2.5; // 快速增長
      }
      break;
    
    default:
      interval = 1;
  }
  
  // 計算下次複習的日期
  const nextReviewDate = new Date();
  nextReviewDate.setHours(nextReviewDate.getHours() + interval * 24);
  
  return {
    interval,
    nextReviewDate: nextReviewDate.toISOString(),
  };
};

export const getDueWords = (learningRecords) => {
  const now = new Date();
  return Object.entries(learningRecords)
    .filter(([_, record]) => {
      if (!record.next_review) return true;
      return new Date(record.next_review) <= now;
    })
    .map(([word, record]) => ({ word, ...record }));
};

export const getStudyStats = (learningRecords) => {
  const records = Object.values(learningRecords);
  
  return {
    total: records.length,
    learning: records.filter(r => r.familiarity < 2).length,
    review: records.filter(r => r.familiarity >= 2 && r.familiarity < 4).length,
    mastered: records.filter(r => r.familiarity === 4).length,
    dueToday: getDueWords(learningRecords).length,
  };
};
