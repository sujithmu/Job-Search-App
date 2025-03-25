// pages/_app.tsx

import React from 'react';
import { AppProps } from 'next/app';
import { CacheProvider } from '@emotion/react';
import { createEmotionCache } from './utils/create-emotion-cache'; // Assuming you have this

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: ReturnType<typeof createEmotionCache>;
}

const MyApp: React.FC<MyAppProps> = (props) => {
  const { Component, pageProps, emotionCache = clientSideEmotionCache } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Component {...pageProps} />
    </CacheProvider>
  );
};

export default MyApp;