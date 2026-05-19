'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    getCost,
    MAX_ENERGY,
    REGEN_PER_TICK,
    STASIS_ENTRY_THRESHOLD,
    STASIS_EXIT_THRESHOLD,
} from '../EnergyCostTable';
import { SIM_TICK_MS, SIMULATE_CMDS } from './constants';
import { MobileView } from './MobileView';
import { DesktopView } from './DesktopView';

export function EnergyDrainSimulator({ isMobile }: { isMobile: boolean }) {
    const [simIndex, setSimIndex] = useState(0);
    const [energy, setEnergy] = useState(MAX_ENERGY);
    const [running, setRunning] = useState(false);
    const [tickCount, setTickCount] = useState(0);

    const pct = Math.max(0, Math.min(100, (energy / MAX_ENERGY) * 100));
    const inStasis = energy <= STASIS_ENTRY_THRESHOLD;
    const exitingStasis = energy > STASIS_ENTRY_THRESHOLD && energy < STASIS_EXIT_THRESHOLD;

    const barColor =
        inStasis || exitingStasis ? 'var(--docs-red)' :
        pct > 60                 ? 'var(--docs-green)' :
        pct > 30                 ? 'var(--docs-orange)' :
                                   'var(--docs-red)';

    const tickCost = SIMULATE_CMDS[simIndex].cmds.reduce(
        (sum, cmd) => sum + getCost(cmd),
        0,
    );

    const netPerTick = inStasis ? REGEN_PER_TICK : -tickCost;

    const handleTick = useCallback(() => {
        setEnergy(prev => {
            const isInStasis = prev <= STASIS_ENTRY_THRESHOLD;
            if (isInStasis) {
                return Math.min(MAX_ENERGY, prev + REGEN_PER_TICK);
            }
            const cost = SIMULATE_CMDS[simIndex].cmds.reduce(
                (sum, cmd) => sum + getCost(cmd),
                0,
            );
            return Math.max(STASIS_ENTRY_THRESHOLD, prev - cost);
        });
        setTickCount(t => t + 1);
    }, [simIndex]);

    const handleReset = useCallback(() => {
        setEnergy(MAX_ENERGY);
        setTickCount(0);
        setRunning(false);
    }, []);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(handleTick, SIM_TICK_MS);
        return () => clearInterval(id);
    }, [running, handleTick]);

    const statusLabel =
        inStasis      ? 'STASIS - REGEN ACTIVE' :
        exitingStasis ? 'EXITING STASIS' :
                        'ENERGY';

    const statusColor = inStasis ? 'var(--docs-red)' : barColor;
    const activePreset = SIMULATE_CMDS[simIndex];

    const handleToggleRunning = useCallback(() => {
        setRunning(prev => !prev);
    }, []);

    const handleChangePreset = useCallback((index: number) => {
        setSimIndex(index);
        handleReset();
    }, [handleReset]);

    const viewProps = {
        energy,
        tickCount,
        simIndex,
        running,
        pct,
        inStasis,
        exitingStasis,
        barColor,
        netPerTick,
        statusLabel,
        statusColor,
        activePreset,
        onToggleRunning: handleToggleRunning,
        onReset: handleReset,
        onChangePreset: handleChangePreset,
    };

    return isMobile ? <MobileView {...viewProps} /> : <DesktopView {...viewProps} />;
}
