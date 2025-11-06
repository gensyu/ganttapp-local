import { AppDispatch, ExtendedColumn, RootState, setColumns, setDateFormat, setIsSavedChangesStore, setShowYear, updateEntireRegularDaysOffSetting, updateHolidayColor } from "../reduxStoreAndSlices/store";
import { ColorInfo, setIsSavedChangesColor } from "../reduxStoreAndSlices/colorSlice";
import { WBSData, DateFormatType, RegularDaysOffSettingsType, HolidayColor } from "../types/DataTypes";
import { updateEntireColorSettings } from "../reduxStoreAndSlices/colorSlice";
import { setEntireData, setHolidays } from "../reduxStoreAndSlices/store";
import { setWbsWidth, setDateRange, setHolidayInput, setTitle, setCalendarWidth, setCellWidth, setLanguage, setIsSavedChangesSettings, setScrollPosition } from "../reduxStoreAndSlices/baseSettingsSlice";
import JSZip from 'jszip';
import { parseHolidaysFromInput } from '../components/Setting/utils/settingHelpers';
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ExtendedTreeDataNode, noteData, setIsSavedChangesNotes, setNotes, NotesModalState } from "../reduxStoreAndSlices/notesSlice";
import { importHistory, clearHistory } from "../reduxStoreAndSlices/historySlice";
import i18n from "i18next";

export const handleExport = async (
  colors: { [id: number]: ColorInfo },
  dateRange: { startDate: string, endDate: string },
  columns: ExtendedColumn[],
  data: { [id: string]: WBSData },
  holidayInput: string,
  holidayColor: HolidayColor,
  regularDaysOffSetting: RegularDaysOffSettingsType,
  wbsWidth: number,
  calendarWidth: number,
  cellWidth: number,
  title: string,
  showYear: boolean,
  dateFormat: DateFormatType,
  treeData: ExtendedTreeDataNode[],
  noteData: noteData,
  language: string,
  scrollPosition: { scrollLeft: number; scrollTop: number },
  notesModalState?: NotesModalState,
  treeExpandedKeys?: React.Key[],
  treeScrollPosition?: number,
  editorStates?: { [key: string]: any },
  selectedNodeKey?: string,
  historySnapshots?: any[],
): Promise<Uint8Array> => {
  const settingsData = {
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
    title,
    showYear,
    dateFormat,
    treeData,
    noteData,
    language,
    scrollPosition,
    ...(notesModalState && { notesModalState }),
    ...(treeExpandedKeys && { treeExpandedKeys }),
    ...(treeScrollPosition !== undefined && { treeScrollPosition }),
    ...(editorStates && { editorStates }),
    ...(selectedNodeKey && { selectedNodeKey }),
    ...(historySnapshots && { historySnapshots }),
  };
  // JSON文字列をUTF-8エンコードしてUint8Arrayとして返す
  const jsonData = JSON.stringify(settingsData, null, 2);
  return new TextEncoder().encode(jsonData);
};

export const handleImport = createAsyncThunk<void, { file: Blob | Uint8Array; skipHistoryImport?: boolean }, { state: RootState, dispatch: AppDispatch }>(
  'project/import',
  async ({ file, skipHistoryImport = false }, { dispatch }) => {
    if (!file) throw new Error("File is not provided");
    
    let parsedData: any;
    
    // Handle Uint8Array (from Tauri) or Blob (legacy)
    let arrayBuffer: ArrayBuffer;
    if (file instanceof Uint8Array) {
      // Uint8Array#buffer may be typed as ArrayBufferLike. Ensure ArrayBuffer by copying.
      arrayBuffer = new Uint8Array(file).buffer;
    } else {
      arrayBuffer = await file.arrayBuffer();
    }
    
    // Check if the file is a JSON file directly (first few bytes check)
    const uint8View = new Uint8Array(arrayBuffer);
    const isJson = uint8View[0] === 0x7B; // '{' character
    
    if (isJson) {
      const jsonData = new TextDecoder().decode(arrayBuffer);
      parsedData = JSON.parse(jsonData);
    } else {
      // Handle as ZIP file
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(arrayBuffer);
      const jsonFileEntry = Object.values(loadedZip.files).find(file => file.name.endsWith('.json'));
      if (!jsonFileEntry) throw new Error("No JSON file found in ZIP");
      const jsonData = await jsonFileEntry.async("string");
      parsedData = JSON.parse(jsonData);
    }
    if (parsedData.colors) {
      dispatch(updateEntireColorSettings(parsedData.colors));
    }
    if (parsedData.dateRange && parsedData.dateRange.startDate && parsedData.dateRange.endDate) {
      dispatch(setDateRange({
        startDate: parsedData.dateRange.startDate,
        endDate: parsedData.dateRange.endDate,
      }));
    }
    if (parsedData.columns && Array.isArray(parsedData.columns)) {
      dispatch(setColumns(parsedData.columns));
    }
    if (parsedData.regularDaysOffSetting) {
      dispatch(updateEntireRegularDaysOffSetting(parsedData.regularDaysOffSetting));
    }
    let dateFormat: DateFormatType;
    if (parsedData.dateFormat) {
      dispatch(setDateFormat(parsedData.dateFormat));
      dateFormat = parsedData.dateFormat;
    } else {
      dateFormat = 'yyyy/M/d'
    }
    if (parsedData.holidayInput) {
      const newHolidayInput = parsedData.holidayInput;
      dispatch(setHolidayInput(newHolidayInput));
      dispatch(setHolidays(parseHolidaysFromInput(newHolidayInput, dateFormat)));
    }
    if (parsedData.holidayColor) {
      dispatch(updateHolidayColor(parsedData.holidayColor.color));
    }
    if (parsedData.data) {
      dispatch(setEntireData(parsedData.data));
    }
    if (parsedData.wbsWidth) {
      dispatch(setWbsWidth(parsedData.wbsWidth));
    }
    if (parsedData.title) {
      dispatch(setTitle(parsedData.title));
    }
    if (parsedData.showYear) {
      dispatch(setShowYear(parsedData.showYear));
    }
    if (parsedData.calendarWidth) {
      dispatch(setCalendarWidth(parsedData.calendarWidth));
    }
    if (parsedData.cellWidth) {
      dispatch(setCellWidth(parsedData.cellWidth));
    }
    if (parsedData.noteData && parsedData.treeData) {
      dispatch(setNotes({ 
        treeData: parsedData.treeData, 
        noteData: parsedData.noteData,
        modalState: parsedData.notesModalState,
        treeExpandedKeys: parsedData.treeExpandedKeys,
        treeScrollPosition: parsedData.treeScrollPosition,
        editorStates: parsedData.editorStates,
        selectedNodeKey: parsedData.selectedNodeKey
      }));
    }
    if (parsedData.language) {
      i18n.changeLanguage(parsedData.language);
      dispatch(setLanguage(parsedData.language));
    }
    if (parsedData.scrollPosition) {
      const scrollPosition = parsedData.scrollPosition;
      if (typeof scrollPosition === 'object' && 
          typeof scrollPosition.scrollLeft === 'number' && 
          typeof scrollPosition.scrollTop === 'number' &&
          scrollPosition.scrollLeft >= 0 && 
          scrollPosition.scrollTop >= 0) {
        dispatch(setScrollPosition(scrollPosition));
      } else {
        dispatch(setScrollPosition({ scrollLeft: 0, scrollTop: 0 }));
      }
    } else {
      dispatch(setScrollPosition({ scrollLeft: 0, scrollTop: 0 }));
    }
    
    // Import history snapshots if they exist and not skipping history import
    if (!skipHistoryImport) {
      if (parsedData.historySnapshots && Array.isArray(parsedData.historySnapshots)) {
        dispatch(importHistory(parsedData.historySnapshots));
      } else {
        // Clear history if no history data exists in imported file
        dispatch(clearHistory());
      }
    }
    
    dispatch(setIsSavedChangesStore(true));
    dispatch(setIsSavedChangesColor(true));
    dispatch(setIsSavedChangesNotes(true));
    dispatch(setIsSavedChangesSettings(true));
  }
);