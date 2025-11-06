import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../reduxStoreAndSlices/store';
import { setLanguage } from '../../reduxStoreAndSlices/baseSettingsSlice';
import i18n from "i18next";
import { setIsLoading } from '../../reduxStoreAndSlices/uiFlagSlice';
import LocalComponents from '../Authenticated/LocalComponents';
import useResetReduxStates from '../../hooks/useResetReduxStates';

const LocalApp: React.FC = () => {
    const dispatch = useDispatch();
    const resetReduxStates = useResetReduxStates();
    const isLoading = useSelector((state: RootState) => state.uiFlags.isLoading);
    const [initError, setInitError] = React.useState<Error | null>(null);

    useEffect(() => {
        const initializeLocalApp = async () => {
            try {
                console.log('Initializing LocalApp...');
                dispatch(setLanguage(i18n.language));
                console.log('Language set, resetting Redux states...');
                await resetReduxStates();
                console.log('Redux states reset, setting loading to false...');
                dispatch(setIsLoading(false));
                console.log('LocalApp initialized successfully');
            } catch (error) {
                console.error('Error initializing local app:', error);
                setInitError(error instanceof Error ? error : new Error(String(error)));
                // エラーが発生してもローディング状態を解除
                dispatch(setIsLoading(false));
            }
        };
        initializeLocalApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (initError) {
        return (
            <div style={{
                padding: '20px',
                fontFamily: 'sans-serif',
                color: '#d32f2f',
                backgroundColor: '#fff',
                minHeight: '100vh',
            }}>
                <h1 style={{ marginBottom: '20px' }}>初期化エラー</h1>
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #d32f2f',
                    borderRadius: '4px',
                    padding: '20px',
                }}>
                    <h2 style={{ marginTop: 0 }}>エラーメッセージ:</h2>
                    <p style={{
                        backgroundColor: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                    }}>
                        {initError.message}
                    </p>
                    {initError.stack && (
                        <>
                            <h3 style={{ marginTop: '20px' }}>スタックトレース:</h3>
                            <pre style={{
                                backgroundColor: '#fff',
                                padding: '10px',
                                borderRadius: '4px',
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                            }}>
                                {initError.stack}
                            </pre>
                        </>
                    )}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    ページを再読み込み
                </button>
            </div>
        );
    }

    return (
        <>
            {!isLoading ? <LocalComponents /> : <div style={{ padding: '10px' }}>Loading...</div>}
        </>
    );
};

export default LocalApp;