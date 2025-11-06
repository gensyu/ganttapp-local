import { memo, useCallback, useMemo, useRef, useState } from 'react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveModal, setIsLoading } from '../../reduxStoreAndSlices/uiFlagSlice';
import { RootState, undo, redo, setMessageInfo, removePastState } from '../../reduxStoreAndSlices/store';
import { useTranslation } from 'react-i18next';
import TitleSetting from './TitleSetting';
import TopMenu from './TopMenu';
import styled from 'styled-components';
import useWarnIfUnsavedChanges from '../../hooks/useWarnIfUnsavedChanges';
import useResetIsSavedChangesFlags from '../../hooks/useResetIsSavedChangesFlags';
import useResetReduxStates from '../../hooks/useResetReduxStates';
import { returnToPresentWithRestore } from '../../reduxStoreAndSlices/historyThunks';

const MenuButton = styled.button`
  border: none;
  border-radius: 3px;
  height: 100%;
  padding: 0px 15px;
  background-color: transparent;
  transition: background-color 0.3s ease;
  &:hover:not(:disabled) {
    background-color: #d6d6d6;
  }
  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
`;

const ReturnButton = styled.button`
  border: none;
  border-radius: 3px;
  height: 100%;
  padding: 0px 15px;
  background-color: #ff9800;
  color: white;
  font-weight: bold;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #f57c00;
  }
`;

const TopBarLocal: React.FC = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const isSavedStore = useSelector((state: RootState) => state.wbsData.isSavedChanges);
  const isSavedColor = useSelector((state: RootState) => state.color.isSavedChanges);
  const isSavedSettings = useSelector((state: RootState) => state.baseSettings.isSavedChanges);
  const isSavedNotes = useSelector((state: RootState) => state.notes.isSavedChanges);
  // 保存で使用するエクスポート元データ
  const currentRegularDaysOffSetting = useSelector((state: RootState) => state.wbsData.regularDaysOffSetting);
  const currentColors = useSelector((state: RootState) => state.color.colors);
  const currentLanguage = useSelector((state: RootState) => state.baseSettings.language);
  const dateRange = useSelector((state: RootState) => state.baseSettings.dateRange);
  const currentHolidayInput = useSelector((state: RootState) => state.baseSettings.holidayInput);
  const holidayColor = useSelector((state: RootState) => state.wbsData.holidayColor);
  const wbsWidth = useSelector((state: RootState) => state.baseSettings.wbsWidth);
  const cellWidth = useSelector((state: RootState) => state.baseSettings.cellWidth);
  const calendarWidth = useSelector((state: RootState) => state.baseSettings.calendarWidth);
  const showYear = useSelector((state: RootState) => state.wbsData.showYear);
  const dateFormat = useSelector((state: RootState) => state.wbsData.dateFormat);
  const data = useSelector((state: RootState) => state.wbsData.data);
  // Historical data for preview functionality
  const isViewingPast = useSelector((state: RootState) => state.history?.isViewingPast || false);
  const previewData = useSelector((state: RootState) => state.history?.previewData);
  const currentTitle = useSelector((state: RootState) => state.baseSettings.title);
  const title = isViewingPast && previewData?.title ? previewData.title : currentTitle;
  const regularDaysOffSetting = isViewingPast && previewData?.regularDaysOffSetting ? previewData.regularDaysOffSetting : currentRegularDaysOffSetting;
  const colors = isViewingPast && previewData?.colors ? previewData.colors : currentColors;
  const holidayInput = isViewingPast && previewData?.holidayInput ? previewData.holidayInput : currentHolidayInput;
  const columns = useSelector((state: RootState) => state.wbsData.columns);
  const treeData = useSelector((state: RootState) => state.notes.treeData);
  const noteData = useSelector((state: RootState) => state.notes.noteData);
  const notesModalState = useSelector((state: RootState) => state.notes.modalState);
  const treeExpandedKeys = useSelector((state: RootState) => state.notes.treeExpandedKeys);
  const treeScrollPosition = useSelector((state: RootState) => state.notes.treeScrollPosition);
  const editorStates = useSelector((state: RootState) => state.notes.editorStates);
  const selectedNodeKey = useSelector((state: RootState) => state.notes.selectedNodeKey);
  const scrollPosition = useSelector((state: RootState) => state.baseSettings.scrollPosition);
  const historySnapshots = useSelector((state: RootState) => state.history?.snapshots || []);
  const pastLength = useSelector((state: RootState) => state.wbsData.past.length);
  const futureLength = useSelector((state: RootState) => state.wbsData.future.length);

  const [visibleMenu, setVisibleMenu] = useState<string | null>(null);
  const fileButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const settingButtonRef = useRef<HTMLButtonElement>(null);
  const resetIsSavedChangesFlags = useResetIsSavedChangesFlags();
  const resetReduxStates = useResetReduxStates();

  useWarnIfUnsavedChanges(!isSavedColor)
  useWarnIfUnsavedChanges(!isSavedNotes)
  useWarnIfUnsavedChanges(!isSavedSettings)
  useWarnIfUnsavedChanges(!isSavedStore)

  const handleNewClick = useCallback(async () => {
    await resetReduxStates();
    resetIsSavedChangesFlags();
    dispatch(setActiveModal(null));
  }, [dispatch, resetReduxStates, resetIsSavedChangesFlags]);

  const handleNotesClick = useCallback(() => {
    dispatch(setActiveModal('notes'));
  }, [dispatch]);

  // 保存 - Tauri保存ダイアログで保存
  const handleSaveJsonClick = useCallback(async () => {
    try {
      const effectiveTitle = title;
      const jsonData = await (await import('../../utils/ExportImportHandler')).handleExport(
        colors,
        dateRange,
        columns,
        data,
        holidayInput,
        holidayColor,
        regularDaysOffSetting,
        wbsWidth,
        calendarWidth,
        cellWidth,
        effectiveTitle,
        showYear,
        dateFormat,
        treeData,
        noteData,
        currentLanguage,
        scrollPosition,
        notesModalState,
        treeExpandedKeys,
        treeScrollPosition,
        editorStates,
        selectedNodeKey,
        historySnapshots,
      );
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const filePath = await save({
        defaultPath: `${effectiveTitle || 'gantt-chart'}.json`,
        filters: [{ name: 'Project', extensions: ['json'] }]
      });
      if (filePath) {
        // Uint8Arrayをそのまま書き込む（TauriのwriteFileはUint8ArrayまたはReadableStreamを期待）
        await writeFile(filePath, jsonData);
        resetIsSavedChangesFlags();
        dispatch(setMessageInfo({ message: t('File saved successfully.'), severity: 'success' }));
      }
    } catch (error) {
      console.error('Save failed:', error);
      // エラーオブジェクトの詳細を取得
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = t('Save failed: ') + error.message;
      } else if (typeof error === 'string') {
        errorMessage = t('Save failed: ') + error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = t('Save failed: ') + String((error as any).message);
      } else {
        errorMessage = t('Save failed. An unknown error occurred.') + (error ? ` (${JSON.stringify(error)})` : '');
      }
      dispatch(setMessageInfo({ message: errorMessage, severity: 'error' }));
    }
  }, [dispatch, title, colors, dateRange, columns, data, holidayInput, holidayColor, regularDaysOffSetting, wbsWidth, calendarWidth, cellWidth, showYear, dateFormat, treeData, noteData, currentLanguage, scrollPosition, notesModalState, treeExpandedKeys, treeScrollPosition, editorStates, selectedNodeKey, historySnapshots, resetIsSavedChangesFlags, t]);

  // Tauriの開くダイアログでJSONを読み込み
  const handleOpenJsonClick = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Project', extensions: ['json'] }]
      });
      if (!selected || Array.isArray(selected)) {
        return;
      }
      dispatch(setIsLoading(true));
      const fileData = await readFile(selected);
      await resetReduxStates();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await dispatch((await import('../../utils/ExportImportHandler')).handleImport({ file: fileData }) as any);
      dispatch(removePastState(1));
      resetIsSavedChangesFlags();
      dispatch(setMessageInfo({ message: t('Saved data opened successfully.'), severity: 'success' }));
      if (visibleMenu) {
        setVisibleMenu(null);
      }
    } catch (error) {
      console.error('Failed to open data.', error);
      const errorMessage = error instanceof Error
        ? t('Failed to open data: ') + error.message
        : t('Failed to open data. An unknown error occurred.');
      dispatch(setMessageInfo({ message: errorMessage, severity: 'error' }));
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [dispatch, t, resetIsSavedChangesFlags, resetReduxStates, visibleMenu]);

  const fileMenuOptions = useMemo(() => {
    const options = [
      {
        children: t('New'),
        onClick: handleNewClick,
        path: '0'
      },
      {
        children: t('Open'),
        onClick: handleOpenJsonClick,
        path: '1'
      },
      {
        children: t('Save'),
        onClick: handleSaveJsonClick,
        path: '2'
      }
    ];
    return options;
  }, [t, handleNewClick, handleOpenJsonClick, handleSaveJsonClick]);

  const editMenuOptions = useMemo(() => {
    const options = [
      {
        children: `${t('Undo')} (${pastLength - 1})`,
        onClick: () => dispatch(undo()),
        path: '0'
      },
      {
        children: `${t('Redo')} (${futureLength})`,
        onClick: () => dispatch(redo()),
        path: '1'
      }
    ];
    return options;
  }, [dispatch, futureLength, pastLength, t]);

  const settingMenuOptions = useMemo(() => {
    const options = [
      {
        children: t('Basic'),
        onClick: () => dispatch(setActiveModal('settingsbasic')),
        path: '0'
      },
      {
        children: t('Chart Setting'),
        onClick: () => dispatch(setActiveModal('settingschart')),
        path: '1'
      },
      {
        children: t('Table'),
        onClick: () => dispatch(setActiveModal('settingstable')),
        path: '2'
      },
      {
        children: t('Days Off'),
        onClick: () => dispatch(setActiveModal('settingsdaysoff')),
        path: '3'
      }
      // 'Manage Access'は除外（認証が必要なため）
    ];
    return options;
  }, [dispatch, t]);

  // ルーター未使用のため、戻る動作は無効（機能なし）

  const handleReturnToPresent = useCallback(() => {
    dispatch(returnToPresentWithRestore() as any);
    dispatch(setMessageInfo({ 
      message: t('Returned to the latest state'), 
      severity: 'success' 
    }));
  }, [dispatch]);

  // ユーザーメニューは現在項目なし（ようこそ画面を表示を削除）


  return (
    <div className="Topbar" style={{ display: 'flex', height: '100%', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
      <div className="TopMenus" style={{ height: '100%', marginLeft: '2px', flex: '0 0 auto' }}>
        <MenuButton ref={fileButtonRef} disabled={isViewingPast}>
          {t('File')}
        </MenuButton>
        {!isViewingPast && (
          <TopMenu
            menuType='file'
            targetRef={fileButtonRef}
            items={fileMenuOptions}
            visibleMenu={visibleMenu}
            setVisibleMenu={setVisibleMenu}
          />
        )}
        <MenuButton ref={editButtonRef} disabled={isViewingPast}>
          {t('Edit')}
        </MenuButton>
        {!isViewingPast && (
          <TopMenu
            menuType='edit'
            targetRef={editButtonRef}
            items={editMenuOptions}
            visibleMenu={visibleMenu}
            setVisibleMenu={setVisibleMenu}
          />
        )}
        <MenuButton ref={settingButtonRef} disabled={false}>
          {t('Setting')}
        </MenuButton>
        <TopMenu
            menuType='setting'
            targetRef={settingButtonRef}
            items={settingMenuOptions}
            visibleMenu={visibleMenu}
            setVisibleMenu={setVisibleMenu}
          />
        <MenuButton onClick={handleNotesClick}>
          {t('Notes')}
        </MenuButton>
        <MenuButton onClick={() => dispatch(setActiveModal('history'))}>
          {t('History')}
        </MenuButton>
        {isViewingPast && (
          <ReturnButton onClick={handleReturnToPresent}>
            {t('Return to Latest')}
          </ReturnButton>
        )}
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', height: '100%', display: 'flex', justifyContent: 'center' }}>
        <TitleSetting />
      </div>
      {/* 右側ユーザーメニューは削除 */}
    </div>
  );
});

export default TopBarLocal;