// CustomNumberCellTemplate.tsx
import { CellTemplate, Compatible, Uncertain, UncertainCompatible, keyCodes, Cell, isNavigationKey, isAlphaNumericKey } from "@silevis/reactgrid";
import { inNumericKey } from "@silevis/reactgrid";


export interface CustomNumberCell extends Cell {
  type: 'customNumber';
  text: string;
  value: number;
  columnWidth?: number;
}

export class CustomNumberCellTemplate implements CellTemplate<CustomNumberCell> {
  private wasEscKeyPressed = false;
  private isComposing = false;

  private isImeKey(keyCode: number, key?: string): boolean {
    return keyCode === 229 || key === 'Process' || key === 'Unidentified';
  }
  getCompatibleCell(uncertainCell: Uncertain<CustomNumberCell>): Compatible<CustomNumberCell> {
    const text = uncertainCell.text || '';
    const value = text.length;
    return { ...uncertainCell, text, value };
  }

  handleKeyDown(
    cell: Compatible<CustomNumberCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    key?: string
  ): { cell: Compatible<CustomNumberCell>; enableEditMode: boolean } {
    if (keyCode === keyCodes.POINTER || keyCode === keyCodes.F2) {
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
    // アルファベットや数字のキー入力で編集モードを開始
    if (key && (isAlphaNumericKey(keyCode) || inNumericKey(keyCode))) {
      return { cell: { ...cell, text: key }, enableEditMode: true };
    }
    return { cell, enableEditMode: false };
  }

  update(cell: Compatible<CustomNumberCell>, cellToMerge: UncertainCompatible<CustomNumberCell>): Compatible<CustomNumberCell> {
    return this.getCompatibleCell({ ...cell, text: cellToMerge.text });
  }

  render(
    cell: Compatible<CustomNumberCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<CustomNumberCell>, commit: boolean) => void
  ): React.ReactNode {
    if (isInEditMode) {
      return (
        <input
          type="text"
          className="input-text js-input-text"
          defaultValue={cell.text}
          ref={input => {
            if (input) {
              input.focus();
              const dummyElement = input.previousSibling as HTMLElement;
              if (dummyElement) {
                dummyElement.textContent = cell.text;
              }
            }
          }}
          onChange={e => {
            const value = e.currentTarget.value;
            onCellChanged(this.getCompatibleCell({ ...cell, text: value }), false);
            const dummyElement = e.currentTarget.previousSibling as HTMLElement;
            if (dummyElement) {
              dummyElement.textContent = value;
            }
          }}
          onBlur={e => { onCellChanged(this.getCompatibleCell({ ...cell, text: e.currentTarget.value }), !this.wasEscKeyPressed); this.wasEscKeyPressed = false; }}
          onCopy={e => e.stopPropagation()}
          onCut={e => e.stopPropagation()}
          onPaste={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onCompositionStart={() => { this.isComposing = true; }}
          onCompositionUpdate={(e: React.CompositionEvent<HTMLInputElement>) => {
            // IMEの未確定文字列を即時に反映して初回キーの見えない問題を軽減
            const target = e.currentTarget;
            const value = target.value;
            if (value !== cell.text) {
              onCellChanged(this.getCompatibleCell({ ...cell, text: value }), false);
              const dummyElement = target.previousSibling as HTMLElement;
              if (dummyElement) {
                dummyElement.textContent = value;
              }
            }
          }}
          onCompositionEnd={() => { this.isComposing = false; }}
          onKeyDown={e => {
            // composition中の Enter/Escape/Tab はセル移動・確定を抑止
            const code = e.keyCode;
            const composing = (e.nativeEvent as any)?.isComposing || this.isComposing || e.key === 'Process' || e.keyCode === 229;
            if (composing && (code === keyCodes.ENTER || code === keyCodes.ESCAPE || e.key === 'Tab')) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (isAlphaNumericKey(e.keyCode) || (isNavigationKey(e.keyCode))) e.stopPropagation();
            if (e.keyCode === keyCodes.ESCAPE) this.wasEscKeyPressed = true;
          }}
        />
      );
    }
    return <span style={{ whiteSpace: 'pre' }}>{cell.text}</span>;
  }
}