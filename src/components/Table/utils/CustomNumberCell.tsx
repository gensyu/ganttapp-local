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
          onKeyDown={e => {
            if (isAlphaNumericKey(e.keyCode) || (isNavigationKey(e.keyCode))) e.stopPropagation();
            if (e.keyCode === keyCodes.ESCAPE) this.wasEscKeyPressed = true;
          }}
        />
      );
    }
    return <span style={{ whiteSpace: 'pre' }}>{cell.text}</span>;
  }
}