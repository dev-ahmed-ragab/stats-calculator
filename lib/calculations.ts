// lib/calculations.ts

// حساب المقاييس للبيانات الخام (Ungrouped Data)
export function calculateUngrouped(numbers: number[]): any {
  const n = numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // الوسيط (Median)
  let median: number;
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  } else {
    median = sorted[(n - 1) / 2];
  }

  // المنوال (Mode)
  const freqMap = new Map<number, number>();
  numbers.forEach(num => {
    freqMap.set(num, (freqMap.get(num) || 0) + 1);
  });
  const maxFreq = Math.max(...Array.from(freqMap.values()));
  const modes = Array.from(freqMap.entries())
    .filter(([_, f]) => f === maxFreq)
    .map(([k]) => k);
  const mode = modes.length > 1 ? modes : modes[0];

  // المدى (Range)
  const range = Math.max(...numbers) - Math.min(...numbers);

  // التباين (Variance, sample: / (n-1))
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Mean Deviation (MD)
  const meanDev = numbers.reduce((sum, num) => sum + Math.abs(num - mean), 0) / n;

  // Coefficient of Variation (CV)
  const cv = (stdDev / mean) * 100;

  // الوسط الهندسي (Geometric Mean)
  const geometricMean = Math.exp(numbers.reduce((sum, num) => sum + Math.log(num), 0) / n);

  // الوسط التوافقي (Harmonic Mean)
  const harmonicMean = n / numbers.reduce((sum, num) => sum + 1 / num, 0);

  return { 
    mean, median, mode, range, variance, stdDev, meanDev, cv, geometricMean, harmonicMean 
  };
}

// حساب عدد الفئات تلقائياً باستخدام صيغة Sturges
export function calculateKAuto(n: number): number {
  return Math.ceil(1 + Math.log2(n));
}

// بناء الجدول التكراري للبيانات الخام (مع إضافة midpoints و cumulative)
export function buildFrequencyTable(numbers: number[], k: number): any[] {
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const rangeVal = max - min;
  const classWidth = rangeVal / k;
  const classes: any[] = [];
  let cumAsc = 0;
  const n = numbers.length;

  for (let i = 0; i < k; i++) {
    const lower = min + i * classWidth;
    const upper = (i === k - 1) ? max + 1 : lower + classWidth; // include max in last class
    const className = `${Math.floor(lower)}-${Math.floor(upper - 1)}`;
    let freq: number;
    if (i === k - 1) {
      freq = numbers.filter(n => n >= lower && n <= max).length;
    } else {
      freq = numbers.filter(n => n >= lower && n < upper).length;
    }
    const midpoint = (lower + upper) / 2;
    cumAsc += freq;
    const cumDesc = n - cumAsc + freq;
    classes.push({
      class: className,
      frequency: freq,
      midpoint: Math.round(midpoint * 10) / 10, // تقريب للدقة مثل PRD
      cumulativeAsc: cumAsc,
      cumulativeDesc: cumDesc
    });
  }

  return classes;
}

// حساب المقاييس للبيانات المبوبة (Grouped Data) مع جدول كامل
export function calculateGrouped(freqTableInput: any[]): any {
  // حساب n أولاً قبل الـ map
  const n = freqTableInput.reduce((sum, row) => sum + row.frequency, 0);

  // بناء الجدول الكامل
  const freqTable = freqTableInput.map(row => {
    const [lowerStr, upperStr] = row.class.split('-');
    const lower = parseFloat(lowerStr);
    const upper = parseFloat(upperStr);
    const midpoint = row.midpoint || (lower + upper) / 2;
    const actualLower = lower - 0.5;
    const actualUpper = upper + 0.5;
    const classWidth = upper - lower + 1; // عرض الفئة
    return {
      class: row.class,
      actualBounds: `${actualLower.toFixed(1)}-${actualUpper.toFixed(1)}`,
      ca: midpoint, // Class Mark (midpoint)
      f: row.frequency,
      rf: (row.frequency / n) * 100, // نسبة مئوية
      cumulativeAsc: 0, // سيتم حسابها
      cumulativeDesc: 0, // سيتم حسابها
      x: midpoint,
      fx: row.frequency * midpoint,
      deviation: 0, // (x - mean), سيتم حساب بعد mean
      fDevSquared: 0 // f * (x - mean)^2
    };
  });

  const sumFx = freqTable.reduce((sum, row) => sum + row.fx, 0);
  const mean = sumFx / n;

  // حساب Cumulative Asc و Desc
  let cumAsc = 0;
  let cumDesc = n;
  freqTable.forEach((row, i) => {
    cumAsc += row.f;
    row.cumulativeAsc = cumAsc;
    row.cumulativeDesc = cumDesc;
    cumDesc -= row.f;
  });

  // حساب Deviation و fDevSquared
  let sumFDevSquared = 0;
  let sumAbsDev = 0; // لـ Mean Deviation
  freqTable.forEach(row => {
    row.deviation = row.x - mean;
    const devSquared = Math.pow(row.deviation, 2);
    row.fDevSquared = row.f * devSquared;
    sumFDevSquared += row.fDevSquared;
    sumAbsDev += row.f * Math.abs(row.deviation);
  });

  // الوسيط (Median) باستخدام القانون للبيانات المبوبة
  const medianPos = n / 2;
  let medianClassIdx = -1;
  for (let i = 0; i < freqTable.length; i++) {
    if (freqTable[i].cumulativeAsc >= medianPos) {
      medianClassIdx = i;
      break;
    }
  }
  const medianClass = freqTable[medianClassIdx];
  const l = parseFloat(medianClass.class.split('-')[0]) - 0.5; // الحد الأدنى الفعلي
  const fPrev = medianClassIdx > 0 ? freqTable[medianClassIdx - 1].cumulativeAsc : 0;
  const f = medianClass.f;
  const classWidth = parseFloat(medianClass.class.split('-')[1]) - parseFloat(medianClass.class.split('-')[0]) + 1;
  const median = l + ((medianPos - fPrev) / f) * classWidth;

  // المنوال (Mode) باستخدام القانون للبيانات المبوبة
  let maxFreqIdx = 0;
  for (let i = 1; i < freqTable.length; i++) {
    if (freqTable[i].f > freqTable[maxFreqIdx].f) {
      maxFreqIdx = i;
    }
  }
  const modeClass = freqTable[maxFreqIdx];
  const lMode = parseFloat(modeClass.class.split('-')[0]) - 0.5;
  const f1 = modeClass.f;
  const f0 = maxFreqIdx > 0 ? freqTable[maxFreqIdx - 1].f : 0;
  const f2 = maxFreqIdx < freqTable.length - 1 ? freqTable[maxFreqIdx + 1].f : 0;
  const classWidthMode = parseFloat(modeClass.class.split('-')[1]) - parseFloat(modeClass.class.split('-')[0]) + 1;
  const denominator = (f1 - f0) + (f1 - f2);
  const mode = denominator !== 0 ? lMode + ((f1 - f0) / denominator) * classWidthMode : lMode;

  // المدى التقريبي
  const minLower = parseFloat(freqTable[0].class.split('-')[0]) - 0.5;
  const maxUpper = parseFloat(freqTable[freqTable.length - 1].class.split('-')[1]) + 0.5;
  const range = maxUpper - minLower;

  // التباين (Sample Variance: / (n-1))
  const variance = sumFDevSquared / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Mean Deviation (MD)
  const meanDev = sumAbsDev / n;

  // Coefficient of Variation (CV %)
  const cv = (stdDev / mean) * 100;

  // الوسط الهندسي (weighted by frequency)
  const weightedLog = freqTable.reduce((sum, row) => sum + row.f * Math.log(row.x), 0) / n;
  const geometricMean = Math.exp(weightedLog);

  // الوسط التوافقي (weighted)
  const harmonicSum = freqTable.reduce((sum, row) => sum + row.f / row.x, 0);
  const harmonicMean = n / harmonicSum;

  return { 
    mean, median, mode, range, variance, stdDev, meanDev, cv, geometricMean, harmonicMean,
    freqTable // الجدول الكامل
  };
}