import * as Print from 'expo-print';
import {
  renderTariffBackground,
  PAGE_W,
  PAGE_H,
  TariffLang,
} from '@/features/tariff/background/tariffBackground';

export type ExportTariffResult = {
  uri: string;
};

export async function exportTariffPdf(
  lang: TariffLang = 'he',
): Promise<ExportTariffResult> {
  const html = renderTariffBackground(lang, PAGE_W, PAGE_H);

  const { uri } = await Print.printToFileAsync({
    html,
    width: PAGE_W,
    height: PAGE_H,
  });

  return { uri };
}

export default exportTariffPdf;
