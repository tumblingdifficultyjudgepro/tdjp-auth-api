import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import AutoShrinkTextTariff from '@/features/tariff/text/TariffAutoShrinkText';

type DisplaySlot = { id: string; label: string; value: number };

type Props = {
    items: DisplaySlot[];
    maxSlots: number;
    direction: 'ltr' | 'rtl';
    isSymbolMode: boolean;
    symbolFontSize?: number;
    slotHPadding?: number;
    height?: number;
    initialWidths?: number[];
    onWidthsChange?: (widths: number[]) => void;
};

const CENTER = { textAlign: 'center' as const };

export default function TariffSlotRow({
    items,
    maxSlots,
    direction,
    isSymbolMode,
    symbolFontSize,
    slotHPadding = 4,
    height = 56,
    initialWidths,
    onWidthsChange,
}: Props) {
    const { colors } = useAppTheme();
    const layoutRTL = direction === 'rtl';
    const writing = layoutRTL ? 'rtl' : 'ltr';

    const slots = useMemo(() => {
        const out: Array<DisplaySlot | null> = new Array(maxSlots).fill(null);
        const k = Math.min(items.length, maxSlots);
        if (layoutRTL) {
            for (let i = 0; i < k; i++) out[maxSlots - 1 - i] = items[i];
        } else {
            for (let i = 0; i < k; i++) out[i] = items[i];
        }
        return out;
    }, [items, layoutRTL, maxSlots]);

    // Calculate a rough estimate as fallback
    const initialEstimate = (Dimensions.get('window').width - 32) / (maxSlots || 8);

    // Initialize with initialWidths if provided, otherwise estimate
    const [slotWidths, setSlotWidths] = useState<number[]>(() =>
        initialWidths && initialWidths.length === maxSlots
            ? initialWidths
            : Array(maxSlots).fill(initialEstimate)
    );

    // Reset if maxSlots changes (and not using initialWidths dynamic update here to avoid loops, 
    // though initialWidths prop change usually means remount or parent update)
    useEffect(() => {
        if (initialWidths && initialWidths.length === maxSlots) {
            setSlotWidths(initialWidths);
        } else {
            // Only reset to estimate if we truly have no data and no current widths
            // But actually, better to keep existing widths if we lose initialWidths?
            // For now, let's just respect initialWidths if present.
        }
    }, [initialWidths, maxSlots]); // Removed initialWidths from dep array to avoid overwrite if parent passes undefined later? 
    // Actually safe to rely on parent logic.

    // Notify parent of width changes
    useEffect(() => {
        onWidthsChange?.(slotWidths);
    }, [slotWidths, onWidthsChange]);

    const onSlotLayout = (idx: number) => (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setSlotWidths((prev) => {
            if (Math.abs(prev[idx] - w) < 1) return prev;
            const next = [...prev];
            next[idx] = w;
            return next;
        });
    };

    const maxFontText = 18;
    const minFontText = 5;
    const effectiveSymbolFont = symbolFontSize ?? 18;
    const symbolLine = Math.round(effectiveSymbolFont * 1.1);
    const symbolMaxH = symbolLine * 3;

    return (
        <View style={styles.row}>
            {slots.map((x, idx) => (
                <View
                    key={`label_slot_${idx}`}
                    style={[
                        styles.slot,
                        {
                            height,
                            borderColor: colors.border,
                            backgroundColor: colors.card,
                        },
                    ]}
                    onLayout={onSlotLayout(idx)}
                >
                    {x ? (
                        isSymbolMode ? (
                            <Text
                                numberOfLines={3}
                                allowFontScaling={false}
                                style={{
                                    ...CENTER,
                                    fontSize: effectiveSymbolFont,
                                    lineHeight: symbolLine,
                                    maxHeight: symbolMaxH,
                                    fontWeight: '900',
                                    color: colors.text,
                                    writingDirection: 'ltr',
                                }}
                            >
                                {x.label}
                            </Text>
                        ) : (
                            <AutoShrinkTextTariff
                                text={x.label}
                                maxFont={maxFontText}
                                minFont={minFontText}
                                maxLines={3}
                                lineHeightRatio={1.1}
                                maxWidth={slotWidths[idx]}
                                horizontalPadding={slotHPadding}
                                style={{
                                    ...CENTER,
                                    fontWeight: '900',
                                    color: colors.text,
                                    writingDirection: writing,
                                }}
                            />
                        )
                    ) : (
                        <Text
                            style={{
                                ...CENTER,
                                fontSize: 18,
                                fontWeight: '900',
                                color: colors.text,
                                writingDirection: writing,
                            }}
                        >
                            —
                        </Text>
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slot: {
        flex: 1,
        marginHorizontal: 2,
        borderRadius: 10,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
