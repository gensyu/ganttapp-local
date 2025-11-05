// CustomDateCellTemplate.tsx
import CustomDatePicker from "./CustomDatePicker";
import { CellTemplate, Compatible, Uncertain, UncertainCompatible, keyCodes, Cell } from "@silevis/reactgrid";
import { standardizeLongDateFormat, standardizeLongDateFormatText, standardizeShortDateFormat } from "./wbsHelpers";
import { DateFormatType } from "../../../types/DataTypes";
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/en';

export interface CustomDateCell extends Cell {
  type: 'customDate';
  text: string;
  longDate: string;
  shortDate: string;
  value: number;
}

export class CustomDateCellTemplate implements CellTemplate<CustomDateCell> {
  showYear: boolean;
  dateFormat: DateFormatType;
  constructor(showYear: boolean, dateFormat: DateFormatType) {
    this.showYear = showYear;
    this.dateFormat = dateFormat;
  }

  private isImeKey(keyCode: number, key?: string): boolean {
    return keyCode === 229 || key === 'Process' || key === 'Unidentified';
  }
  getCompatibleCell(uncertainCell: Uncertain<CustomDateCell>): Compatible<CustomDateCell> {
    const rawText = uncertainCell.text || '';
    const normalizedText = standardizeLongDateFormatText(rawText, this.dateFormat) || '';
    const longDate = standardizeLongDateFormat(normalizedText, this.dateFormat) || '';
    const shortDate = standardizeShortDateFormat(normalizedText, this.dateFormat) || '';
    const value = NaN;
    return { ...uncertainCell, text: rawText, longDate, shortDate, value };
  }

  handleKeyDown(
    cell: Compatible<CustomDateCell>,
    keyCode: number,
    ctrl?: boolean,
    shift?: boolean,
    alt?: boolean,
    key?: string
  ): { cell: Compatible<CustomDateCell>; enableEditMode: boolean } {
    if (keyCode === keyCodes.F2 || keyCode === keyCodes.POINTER) {
      return { cell, enableEditMode: true };
    }
    // 修飾キーが押されている場合は編集モードに入らない（ショートカットキーのため）
    if (ctrl || alt) {
      return { cell, enableEditMode: false };
    }
    // IME入力開始を検知して編集モードに入る
    if (this.isImeKey(keyCode, key)) {
      return { cell, enableEditMode: true };
    }
    // 数字やスラッシュなどのキー入力で編集モードを開始（日付入力用）
    if (key && ((keyCode >= 48 && keyCode <= 57) || key === '/' || key === '-')) {
      // 最初のキーをそのまま初期値にして編集モードへ
      return { cell: { ...cell, text: key }, enableEditMode: true };
    }
    return { cell, enableEditMode: false };
  }

  update(cell: Compatible<CustomDateCell>, cellToMerge: UncertainCompatible<CustomDateCell>): Compatible<CustomDateCell> {
    return this.getCompatibleCell({ ...cell, text: cellToMerge.text });
  }

  render(
    cell: Compatible<CustomDateCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<CustomDateCell>, commit: boolean) => void
  ): React.ReactNode {
    if (isInEditMode) {
      return (
        <CustomDatePicker
          cell={cell}
          onCellChanged={(updatedCell, commit) => {
            onCellChanged(updatedCell, commit);
          }}
        />
      );
    }
    return <span>{this.showYear ? cell.longDate : cell.shortDate}</span>;
  }
}