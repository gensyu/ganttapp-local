// CustomDateCellTemplate.tsx
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { Compatible, Cell } from "@silevis/reactgrid";
import { isAlphaNumericKey, keyCodes } from "@silevis/reactgrid";
import dayjs from 'dayjs';
import Popper from '@mui/material/Popper';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { RootState } from "../../../reduxStoreAndSlices/store";
import { useSelector } from "react-redux";
import { standardizeLongDateFormatText } from "./wbsHelpers";

interface CustomDateCell extends Cell {
  type: 'customDate';
  text: string;
  longDate: string;
  shortDate: string;
  value: number;
}

interface CustomDatePickerProps {
  cell: Compatible<CustomDateCell>;
  onCellChanged: (cell: Compatible<CustomDateCell>, commit: boolean) => void;
}

const CustomDatePicker = memo(({ cell, onCellChanged }: CustomDatePickerProps) => {
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const rowHeight = useSelector((state: RootState) => state.baseSettings.rowHeight);
  const [inputText, setInputText] = useState<string>(cell.text || '');
  const datePickerInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasEscKeyPressedRef = useRef(false);
  const initialTextRef = useRef<string>(cell.text || '');
  const isComposingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (datePickerInputRef.current) {
      datePickerInputRef.current.focus();
    }
  }, []);

  // cell.textが変更されたら（外部から）テキストを更新
  useEffect(() => {
    // 空の場合は初期状態に
    if (!cell.text || cell.text.trim() === '') {
      setInputText('');
      initialTextRef.current = '';
      return;
    }
    
    const parsed = dayjs(cell.text);
    if (parsed.isValid() && parsed.year() >= 1970 && parsed.year() <= 2099) {
      setInputText(cell.text);
    } else {
      setInputText(cell.text);
    }
    initialTextRef.current = cell.text;
  }, [cell.text, dateFormat]);

  // テキストフィールドの変更を処理
  const handleTextFieldChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setInputText(newText);
    // 入力中はローカル状態のみ更新し、Reduxへは確定時に反映する
  }, [setInputText]);

  // テキストフィールドの確定処理（BlurまたはEnter）
  const handleCommit = useCallback(() => {
    // composition中はcommitを遅延
    if (isComposingRef.current) {
      return;
    }
    if (wasEscKeyPressedRef.current) {
      wasEscKeyPressedRef.current = false;
      // Escキーが押された場合は元の値に戻す
      setInputText(initialTextRef.current);
      onCellChanged({ ...cell, text: initialTextRef.current }, false);
      setIsFocused(false);
      return;
    }

    // 入力テキストを正規化
    const standardized = standardizeLongDateFormatText(inputText, dateFormat);
    if (standardized) {
      const parsed = dayjs(standardized);
      if (parsed.isValid()) {
        const newDateString = parsed.format("YYYY/MM/DD");
        setInputText(newDateString);
        onCellChanged({ ...cell, text: newDateString }, true);
      } else {
        // 無効な日付の場合は空文字に
        setInputText("");
        onCellChanged({ ...cell, text: "" }, true);
      }
    } else {
      // パースに失敗した場合は空文字に
      setInputText("");
      onCellChanged({ ...cell, text: "" }, true);
    }
    setIsFocused(false);
  }, [inputText, dateFormat, cell, onCellChanged]);

  // テキストフィールドのキー押下処理
  const handleTextFieldKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // composition中の Enter/Escape/Tab はセル移動・確定を抑止
    const composing = (event.nativeEvent as any)?.isComposing || isComposingRef.current || event.key === 'Process' || event.keyCode === 229;
    if (composing && (event.key === 'Tab' || event.keyCode === keyCodes.ENTER || event.keyCode === keyCodes.ESCAPE)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Tabはグリッドに委ねる（移動のため）
    if (event.key === 'Tab') {
      handleCommit();
      return;
    }
    // 文字キーはグリッドに伝播させない
    if (isAlphaNumericKey(event.keyCode)) {
      event.stopPropagation();
    }
    if (event.keyCode === keyCodes.ESCAPE) {
      wasEscKeyPressedRef.current = true;
      event.stopPropagation();
    }
    if (event.keyCode === keyCodes.ENTER) {
      // Enterは確定のみ行い、イベントはグリッドに委ねて移動/確定処理を継続
      handleCommit();
    }
  }, [handleCommit]);

  return (
    <div
      ref={containerRef}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      className="customdatepicker"
      style={{ position: 'absolute', top: '-2px', left: '-2px' }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <input
          ref={datePickerInputRef}
          type="text"
          value={inputText}
          onChange={handleTextFieldChange}
          onBlur={handleCommit}
          onFocus={() => setIsFocused(true)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
          onKeyDown={handleTextFieldKeyDown}
          onCopy={e => e.stopPropagation()}
          onCut={e => e.stopPropagation()}
          onPaste={e => e.stopPropagation()}
          style={{
            height: `${rowHeight - 3}px`,
            padding: '2px 22px 2px 4px',
            width: '77px',
            fontSize: '0.73rem',
            fontFamily: 'Meiryo',
            border: '2px solid #3579F8',
            backgroundColor: 'aliceblue',
          }}
        />
        {isFocused && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); }}
            onClick={() => setCalendarOpen(prev => !prev)}
            style={{
              position: 'absolute',
              right: 2,
              top: 2,
              height: `${rowHeight - 7}px`,
              width: '18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Open calendar"
          >
            📅
          </button>
        )}
      </div>
      <Popper open={calendarOpen} anchorEl={containerRef.current} placement="bottom-start" style={{ zIndex: 1300 }}>
        <div onMouseDown={e => e.preventDefault()}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={inputText ? dayjs(inputText) : null}
              onChange={(newValue) => {
                const val = newValue && newValue.isValid() ? newValue.format('YYYY/MM/DD') : '';
                setInputText(val);
                onCellChanged({ ...cell, text: val }, true);
                setCalendarOpen(false);
                // フォーカスを戻す
                setTimeout(() => datePickerInputRef.current?.focus(), 0);
              }}
              disableHighlightToday={false}
            />
          </LocalizationProvider>
        </div>
      </Popper>
    </div>
  );
});

export default CustomDatePicker;