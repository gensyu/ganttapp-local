import { AppDispatch, RootState } from "../reduxStoreAndSlices/store";
import { addSnapshot } from "../reduxStoreAndSlices/historySlice";
import { compressData } from "./CompressionUtils";

export const createSnapshot = async (
  commitMessage: string,
  dispatch: AppDispatch,
  state: RootState
) => {
  try {
    // Create project data directly as JSON (not ZIP)
    const projectData = {
      colors: state.color.colors,
      fallbackColor: state.color.fallbackColor,
      columns: state.wbsData.columns,
      data: state.wbsData.data,
      holidayInput: state.baseSettings.holidayInput,
      regularDaysOffSetting: state.wbsData.regularDaysOffSetting,
      title: state.baseSettings.title,
      dateFormat: state.wbsData.dateFormat,
      treeData: state.notes.treeData,
      noteData: state.notes.noteData,
    };



    const jsonString = JSON.stringify(projectData, null, 2);
    
    // データを圧縮
    const compressedData = await compressData(jsonString);

    dispatch(addSnapshot({
      commitMessage,
      projectDataSnapshot: compressedData,
    }));

    return true;
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return false;
  }
};