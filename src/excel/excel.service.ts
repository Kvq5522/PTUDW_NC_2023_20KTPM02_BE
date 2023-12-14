import { Global, Injectable } from '@nestjs/common';

import * as xlxs from 'xlsx';

@Global()
@Injectable()
export class ExcelService {
  private validateExcelSheet(
    excel: Buffer,
    sheetName: string,
    expectedHeaders: string[],
  ) {
    const uploadData = xlxs.read(excel, { type: 'buffer' });
    const sheet = uploadData.Sheets[sheetName ?? uploadData.SheetNames[0]];

    const headers = this.extractHeadersFromSheet(sheet);

    const isMatch = expectedHeaders.every((header) => headers.includes(header));

    if (!isMatch) return false;

    return true;
  }

  private extractHeadersFromSheet(sheet: xlxs.WorkSheet) {
    const headers: string[] = [];
    const range = xlxs.utils.decode_range(sheet['!ref']);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = xlxs.utils.encode_cell({ c: C, r: range.s.r });
      const header = sheet[address]?.v;

      headers.push(header);
    }

    return headers;
  }

  parseExcelSheet(excel: Buffer, sheetName: string, expectedHeaders: string[]) {
    const validate = this.validateExcelSheet(excel, sheetName, expectedHeaders);

    if (!validate) return null;

    const uploadData = xlxs.read(excel, { type: 'buffer' });
    const sheet = uploadData.Sheets[sheetName ?? uploadData.SheetNames[0]];

    return xlxs.utils.sheet_to_json(sheet);
  }

  async writeExcelFile(data: any[], sheetName: string, headers: string[]) {
    const sheet = xlxs.utils.json_to_sheet(data, { header: headers });

    const workbook = xlxs.utils.book_new();
    xlxs.utils.book_append_sheet(workbook, sheet, sheetName ?? 'Sheet1');

    return await xlxs.writeXLSX(workbook, { type: 'buffer' });
  }
}
