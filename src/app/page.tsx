/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import { Suspense } from 'react';

import { NetflixHomePage } from '@/components/NetflixHome';

export default function Home() {
  return (
    <Suspense>
      <NetflixHomePage />
    </Suspense>
  );
}
