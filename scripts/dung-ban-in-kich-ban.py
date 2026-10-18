# -*- coding: utf-8 -*-
"""Dung ban in duoc cua kich ban noi: docs/kich-ban-bao-ve.md -> .docx -> .pdf

    python3 scripts/dung-ban-in-kich-ban.py

Kieu chu lay tu chinh quyen bao cao (Times New Roman 13pt, gian dong 1.5, le
trai 3cm) de ban in kich ban trong giong quyen bao cao. Pandoc chep ca thu muc
anh cua tep mau sang tep ket qua, nen o day dung mot ban sao da bo het anh —
khong bo thi tep kich ban phinh tu 37 KB len 11 MB chi vi anh khong he dung toi.
"""
import os, re, shutil, subprocess, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NGUON = os.path.join(ROOT, 'docs', 'kich-ban-bao-ve.md')
MAU = os.path.join(ROOT, 'thesis', 'doc', 'bao-cao-noi-dung.docx')
RA_DOC = os.path.join(ROOT, 'thesis', 'doc', 'kich-ban-bao-ve.docx')
RA_PDF = os.path.join(ROOT, 'thesis', 'pdf')


def mau_chi_co_kieu(dich):
    """Chep tep mau nhung bo anh va bo noi dung than bai, giu lai kieu va le trang."""
    src = zipfile.ZipFile(MAU)
    with zipfile.ZipFile(dich, 'w', zipfile.ZIP_DEFLATED) as out:
        for it in src.infolist():
            if it.filename.startswith('word/media/'):
                continue
            d = src.read(it.filename)
            if it.filename == 'word/_rels/document.xml.rels':
                d = re.sub(rb'<Relationship[^>]*Target="media/[^"]*"[^>]*/>', b'', d)
            if it.filename == 'word/document.xml':
                s = d.decode('utf-8')
                sect = re.search(r'<w:sectPr.*?</w:sectPr>', s, re.S).group(0)
                s = re.sub(r'<w:body>.*</w:body>',
                           '<w:body><w:p/>' + sect + '</w:body>', s, flags=re.S)
                d = s.encode('utf-8')
            out.writestr(it, d)


def main():
    for f in (NGUON, MAU):
        if not os.path.exists(f):
            raise SystemExit('thieu %s' % f)
    with tempfile.TemporaryDirectory() as d:
        mau = os.path.join(d, 'mau-kieu.docx')
        mau_chi_co_kieu(mau)
        subprocess.run(['pandoc', NGUON, '--reference-doc=' + mau, '-o', RA_DOC],
                       check=True)
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf',
                    '--outdir', RA_PDF, RA_DOC], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    pdf = os.path.join(RA_PDF, 'kich-ban-bao-ve.pdf')
    if not os.path.exists(pdf):
        raise SystemExit('libreoffice khong xuat duoc %s' % pdf)
    so = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
    trang = re.search(r'^Pages:\s*(\d+)', so, re.M)
    print('  -> %s (%d KB)' % (RA_DOC, os.path.getsize(RA_DOC) // 1024))
    print('  -> %s (%s trang)' % (pdf, trang.group(1) if trang else '?'))


if __name__ == '__main__':
    main()
