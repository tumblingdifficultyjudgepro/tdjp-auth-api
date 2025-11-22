import * as Print from 'expo-print';
import { PAGE_W, PAGE_H } from '@/features/tariff/background/tariffBackground';
import { TariffExportData, buildTariffPageHtml } from '@/features/tariff/export/tariffOverlay';

export type ExportTariffResult = {
  uri: string;
};

export async function exportTariffPdf(
  data: TariffExportData,
): Promise<ExportTariffResult> {
  const html = buildTariffPageHtml(data);

  const { uri } = await Print.printToFileAsync({
    html,
    width: PAGE_W,
    height: PAGE_H,
  });

  return { uri };
}

export default exportTariffPdf;
