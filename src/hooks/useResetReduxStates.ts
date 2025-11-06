// useResetReduxStates.ts
import { useDispatch } from 'react-redux';
import { resetBaseSettings, setCurrentFileId, setHolidayInput } from '../reduxStoreAndSlices/baseSettingsSlice';
import { resetColor } from '../reduxStoreAndSlices/colorSlice';
import { resetNotes } from '../reduxStoreAndSlices/notesSlice';
import { clearHistory } from '../reduxStoreAndSlices/historySlice';
import { resetStore, setColumns, setDateFormat, setHolidays } from '../reduxStoreAndSlices/store';
import { t } from 'i18next';
import { initialColumns } from '../reduxStoreAndSlices/initialColumns';
import { determineDateFormat, getInitialHolidays } from '../utils/CommonUtils';

const useResetReduxStates = (): () => Promise<void> => {
    const dispatch = useDispatch();
    const dateFormat = determineDateFormat();

    const resetReduxStates = async (): Promise<void> => {
        // ルーター未使用

        dispatch(resetStore());
        dispatch(resetNotes());
        dispatch(resetBaseSettings());
        dispatch(resetColor());
        dispatch(clearHistory());
        dispatch(setCurrentFileId(''));
        dispatch(setDateFormat(dateFormat));

        // ルーターを使用しないため、ナビゲーションは行わない

        try {
            const { holidayInput, parsedHolidays } = await getInitialHolidays(dateFormat);
            dispatch(setHolidayInput(holidayInput));
            dispatch(setHolidays(parsedHolidays));
        } catch (error) {
            console.error('Error fetching initial holidays:', error);
        }

        const translatedColumns = initialColumns.map(column => ({
            ...column,
            columnName: t(column.columnName ?? ""),
        }));
        dispatch(setColumns(translatedColumns));
    };

    return resetReduxStates;
};

export default useResetReduxStates;