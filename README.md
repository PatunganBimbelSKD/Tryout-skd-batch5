# Patungan Bimbel SKD — Bonus Batch 5

Website statis simulasi CAT SKD CPNS untuk GitHub Pages.

## Fitur utama

- Login peserta dengan nama bebas dan satu password bersama.
- Branding Patungan Bimbel SKD dan Bonus Batch 5.
- Satu paket Tryout aktif: 110 soal, 100 menit.
- Dua kartu Tryout tambahan berstatus **Coming Soon**.
- Tujuh paket Latihan Soal TIU: 70 soal, 10 menit per paket.
- Timer, navigator soal, simpan progres per sesi peserta, hasil, kunci, dan pembahasan.
- Statistik TWK, TIU, TKP, passing grade, serta bobot TKP 1–5.
- Motion graphic, transisi, mode gelap, dan tata letak responsif desktop/ponsel.
- Tidak memerlukan framework, database, package manager, atau proses build.
- Tidak menampilkan keterangan sumber materi pada halaman peserta.

## Isi Tryout

- TWK: 30 soal.
- TIU: 35 soal.
- TKP: 45 soal.
- Durasi: 100 menit.
- Passing grade: TWK 65, TIU 80, TKP 166.
- TWK/TIU: 5 poin untuk jawaban benar.
- TKP: bobot setiap opsi 1–5 poin.

Data berada di `data/exam.json` dan `data/questions.json`. Pertanyaan, lima opsi, kunci, dan pembahasan Tryout direpresentasikan sebagai data terstruktur. Tujuh soal figural memakai aset gambar terpisah.

## Isi Latihan Soal

Tujuh paket, masing-masing 10 soal:

1. Penalaran Logis
2. Operasi Bilangan
3. Analitis Kombinasi
4. Perbandingan (Kecukupan Data)
5. Aritmatika Sosial (Kecukupan Data)
6. Jarak, Kecepatan, dan Waktu (Kecukupan Data)
7. Deret

Durasi setiap paket 10 menit. Jawaban benar bernilai 5 poin; salah atau kosong bernilai 0 poin. Metadata dan kunci tersimpan di `data/practice.json`. Untuk mempertahankan susunan tabel, angka, dan bentuk materi, soal, opsi, dan pembahasan latihan menggunakan aset gambar WebP individual yang dimuat per paket melalui `data/practice-assets-p01.js` sampai `p07.js` (bukan screenshot satu halaman PDF penuh). Empat pembahasan Deret nomor 6, 7, 8, dan 10 dilengkapi perhitungan tambahan yang ditampilkan sebagai penjelasan terpisah.

## Login dan keamanan

- Nama peserta bebas diisi (maksimal 60 karakter).
- Password bersama: `luluscpns2027`.
- Password diverifikasi menggunakan hash SHA-256; teks password tidak disimpan pada penyimpanan browser.
- Progres Tryout dan latihan disimpan lokal per ID sesi peserta pada browser.

**Penting:** GitHub Pages merupakan hosting statis. Password gate ini bukan autentikasi server-side dan tidak dapat melindungi bank soal dari orang yang memeriksa atau mengubah source code. Jika diperlukan akses rahasia dan rekap nilai terpusat, gunakan backend/authentication dan database.

## Menjalankan secara lokal

Di folder proyek jalankan:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000` di Chrome atau Firefox versi terbaru. Jangan membuka `index.html` langsung dari file manager karena aplikasi memuat data JSON menggunakan `fetch`.

## Publikasi ke GitHub Pages

1. Buat repository GitHub.
2. Ekstrak ZIP ini.
3. Unggah **seluruh isi folder proyek** ke root repository (jangan unggah ZIP mentah).
4. Buka **Settings → Pages**.
5. Pilih **Deploy from a branch**.
6. Pilih branch `main` dan folder `/ (root)`, lalu simpan.
7. Tunggu deployment selesai dan buka URL GitHub Pages.

Semua path menggunakan relative path sehingga dapat berjalan di root repository GitHub Pages.

## Struktur proyek

```text
Patungan-Bimbel-SKD-Batch5/
├── index.html
├── styles.css
├── app.js
├── README.md
├── AUDIT.md
├── .nojekyll
├── assets/
│   ├── logo-patungan.png
│   ├── favicon.svg
│   └── figural-59.png ... figural-65.png
└── data/
    ├── exam.json
    ├── questions.json
    ├── practice.json
    └── practice-assets-p01.js ... practice-assets-p07.js
```

Laporan crosscheck dan batas pengujian ada di `AUDIT.md`.
