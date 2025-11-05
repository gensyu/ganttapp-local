// utils/wbsHelpers.ts
import { v4 as uuidv4 } from 'uuid';
import { DateFormatType, WBSData } from '../../../types/DataTypes';
import { parse, format } from 'date-fns';

export const assignIds = (data: WBSData[]): { [id: string]: WBSData } => {
  const dataWithIdsAndNos: { [id: string]: WBSData } = {};
  data.forEach((row, index) => {
    const id = row.id || uuidv4();
    dataWithIdsAndNos[id] = { ...row, id, no: index + 1 };
  });
  return dataWithIdsAndNos;
};

export const reorderArray = <T extends { id: string }>(arr: T[], indexesToMove: number[], newIndex: number): T[] => {
  const itemsToMove = indexesToMove.map(index => arr[index]);
  const remainingItems = arr.filter((_, index) => !indexesToMove.includes(index));
  const maxIndexToMove = Math.max(...indexesToMove);

  if (maxIndexToMove < newIndex) {
    newIndex -= indexesToMove.length - 1;
  }

  if (newIndex > arr.length - indexesToMove.length) {
    newIndex = arr.length - indexesToMove.length;
  } else if (newIndex < 0) {
    newIndex = 0;
  }

  const start = remainingItems.slice(0, newIndex);
  const end = remainingItems.slice(newIndex);

  return [...start, ...itemsToMove, ...end];
};

const dateCache = {
  text: new Map<string, string>(),
  longFormat: new Map<string, string>(),
  shortFormat: new Map<string, string>()
};

export function standardizeShortDateFormat(dateStr: string, dateFormat: DateFormatType) {
  const cacheKey = `${dateFormat}|${dateStr}`;
  if (dateCache.shortFormat.has(cacheKey)) {
    return dateCache.shortFormat.get(cacheKey);
  }
  const formatMap = {
    'yyyy/MM/dd': 'MM/dd',
    'MM/dd/yyyy': 'MM/dd',
    'dd/MM/yyyy': 'dd/MM',
    'yyyy/M/d': 'M/d',
    'M/d/yyyy': 'M/d',
    'd/M/yyyy': 'd/M',
  };

  const targetFormat = formatMap[dateFormat];
  let result = dateStr;

  // まず標準化された形式（yyyy/M/d）にパースしてから、短い形式にフォーマット
  const standardized = standardizeLongDateFormatText(dateStr, dateFormat);
  if (standardized) {
    try {
      const parsedDate = parse(standardized, 'yyyy/M/d', new Date());
      if (!isNaN(parsedDate.getTime())) {
        result = format(parsedDate, targetFormat);
      } else {
        result = '';
      }
    } catch (e) {
      result = '';
    }
  } else {
    result = '';
  }

  dateCache.shortFormat.set(cacheKey, result);
  return result;
}

export function standardizeLongDateFormatText(dateStr: string, dateFormat: DateFormatType) {
  const cacheKey = `${dateFormat}|${dateStr}`;
  if (dateCache.text.has(cacheKey)) {
    return dateCache.text.get(cacheKey);
  }

  const formatMap: { [key in DateFormatType]: string[] } = {
    'yyyy/MM/dd': ['yyyy/MM/dd', 'yyyy-MM-dd', 'yyyy/M/d', 'yyyy-M-d', 'MM/dd', 'M/d', 'MM-dd', 'M-d'],
    'MM/dd/yyyy': ['MM/dd/yyyy', 'MM-dd-yyyy', 'M/d/yyyy', 'M-d-yyyy', 'MM/dd', 'M/d', 'MM-dd', 'M-d'],
    'dd/MM/yyyy': ['dd/MM/yyyy', 'dd-MM-yyyy', 'd/M/yyyy', 'd-M-yyyy', 'dd/MM', 'd/M', 'dd-MM', 'd-M'],
    'yyyy/M/d': ['yyyy/M/d', 'yyyy-M-d', 'M/d', 'M-d'],
    'M/d/yyyy': ['M/d/yyyy', 'M-d-yyyy', 'M/d', 'M-d'],
    'd/M/yyyy': ['d/M/yyyy', 'd-M-yyyy', 'd/M', 'd-M']
  };
  const targetFormats = formatMap[dateFormat] || [];
  let result = dateStr;

  const referenceDate = new Date();

  // 年のない入力（例: 11/11, 1-2）を現在年で補完
  const trimmed = dateStr.trim();
  const mdOnly = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})$/);
  if (mdOnly) {
    const part1 = parseInt(mdOnly[1], 10);
    const part2 = parseInt(mdOnly[2], 10);
    // 現在の表示設定から、月/日か日/月かを判定（英米系は月/日、EU系は日/月）
    const isMonthFirst = !(dateFormat === 'dd/MM/yyyy' || dateFormat === 'd/M/yyyy');
    const month = isMonthFirst ? part1 : part2;
    const day = isMonthFirst ? part2 : part1;
    const year = referenceDate.getFullYear();
    // 可変桁で組み立て（内部は yyyy/M/d で統一）
    const ymd = `${year}/${month}/${day}`;
    try {
      const parsedMd = parse(ymd, 'yyyy/M/d', referenceDate);
      if (!isNaN(parsedMd.getTime())) {
         result = format(parsedMd, 'yyyy/M/d');
         dateCache.text.set(cacheKey, result);
         return result;
      }
    } catch (e) {
      // 何もしない（後続の通常処理に委ねる）
    }
  }

  for (const fmt of targetFormats) {
    try {
      // 年がないフォーマットの場合は、現在の年を補完
      const parsedDate = parse(dateStr, fmt, referenceDate);
      if (!isNaN(parsedDate.getTime())) {
        // パースされた日付が有効な範囲内かチェック（1970-2099）
        const year = parsedDate.getFullYear();
        if (year >= 1970 && year <= 2099) {
          result = format(parsedDate, 'yyyy/M/d');
          break;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // パースに失敗した場合は空文字を返す
  if (result === dateStr && dateStr.trim() !== '') {
    // 再度試行（空文字の場合はそのまま返す）
    let parsed = false;
    for (const fmt of targetFormats) {
      try {
        const parsedDate = parse(dateStr, fmt, referenceDate);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          if (year >= 1970 && year <= 2099) {
            result = format(parsedDate, 'yyyy/M/d');
            parsed = true;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    if (!parsed) {
      result = '';
    }
  }

  dateCache.text.set(cacheKey, result);
  return result;
}

export function standardizeLongDateFormat(dateStr: string, dateFormat: DateFormatType) {
  const cacheKey = `${dateFormat}|${dateStr}`;
  if (dateCache.longFormat.has(cacheKey)) {
    return dateCache.longFormat.get(cacheKey);
  }
  const formatMap = {
    'yyyy/MM/dd': 'yyyy/MM/dd',
    'MM/dd/yyyy': 'MM/dd/yyyy',
    'dd/MM/yyyy': 'dd/MM/yyyy',
    'yyyy/M/d': 'yyyy/M/d',
    'M/d/yyyy': 'M/d/yyyy',
    'd/M/yyyy': 'd/M/yyyy'
  };
  const targetFormat = formatMap[dateFormat];
  let result = dateStr;

  // まず標準化された形式（yyyy/M/d）にパースしてから、長い形式にフォーマット
  const standardized = standardizeLongDateFormatText(dateStr, dateFormat);
  if (standardized) {
    try {
      const parsedDate = parse(standardized, 'yyyy/M/d', new Date());
      if (!isNaN(parsedDate.getTime())) {
        result = format(parsedDate, targetFormat);
      } else {
        result = '';
      }
    } catch (e) {
      result = '';
    }
  } else {
    result = '';
  }

  dateCache.longFormat.set(cacheKey, result);
  return result;
}