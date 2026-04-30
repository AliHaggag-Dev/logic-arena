'use client';

import React from 'react';
import { SectionLabel } from './SectionLabel';
import { EnergyCostTable } from './EnergyCostTable';
import { EnergyDrainSimulator } from './EnergyDrainSimulator';

export function EnergyCostSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      <SectionLabel text="ENERGY SYSTEM v2.3" isMobile={isMobile} />
      <div className={`mt-5 flex flex-col ${isMobile ? 'gap-8' : 'gap-10'}`}>
        <EnergyCostTable isMobile={isMobile} />
        <EnergyDrainSimulator isMobile={isMobile} />
      </div>
    </section>
  );
}
