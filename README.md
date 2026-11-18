# Patungan Bimbel SKD — Bonus Batch 5

Website statis siap GitHub Pages untuk **Tryout dan Latihan Soal SKD**.

## Fitur

- Password gate sebelum masuk.
- Dashboard bergaya CAT modern.
- 1 Tryout aktif:
  - 110 soal
  - 100 menit
  - TWK 30 soal
  - TIU 35 soal
  - TKP 45 soal
- 2 kartu Tryout lain berstatus **Coming Soon**.
- 7 paket latihan:
  - Penalaran Logis
  - Operasi Bilangan
  - Perbandingan (Kecukupan Data)
  - Aritmatika Sosial (Kecukupan Data)
  - Jarak, Kecepatan, dan Waktu (Kecukupan Data)
  - Deret
  - Analitis Kombinasi (Kecukupan Data)
- Timer otomatis.
- Navigator nomor soal.
- Penyimpanan progres sesi di browser.
- Statistik hasil.
- Kunci jawaban.
- Pembahasan lengkap dari halaman PDF sumber.
- Penilaian:
  - TWK/TIU: 5 poin untuk jawaban benar.
  - TKP: bobot 1–5 poin mengikuti bobot pada PDF sumber.
  - Latihan TIU: 5 poin untuk jawaban benar.
- Tombol Cetak / Simpan PDF melalui dialog print browser.
- Tidak memakai framework/build step sehingga mudah dipasang di GitHub Pages.

## Struktur

```text
patungan-bimbel-skd/
├── index.html
├── app.js
├── data.js
├── style.css
├── .nojekyll
└── assets/
    ├── logo.png
    ├── tryout/
    │   ├── questions/
    │   └── explanations/
    ├── latihan/
    │   ├── penalaran-logis/
    │   ├── operasi-bilangan/
    │   ├── perbandingan/
    │   ├── aritmatika-sosial/
    │   ├── jarak-kecepatan-waktu/
    │   ├── deret/
    │   └── analitis-kombinasi/
    └── latihan-explanations/
        └── ...
```

## GitHub Pages

1. Buat repository baru, misalnya `patungan-bimbel-skd`.
2. Upload seluruh isi folder ini ke repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`.
6. Simpan.
7. Tunggu proses deployment GitHub Pages selesai.

Karena semua path menggunakan relative path, website dapat berjalan di root GitHub Pages maupun pada URL repository.

## Catatan keamanan

Website ini sengaja dibuat statis agar mudah digunakan di GitHub Pages. Password dibandingkan menggunakan SHA-256 hash, tetapi **GitHub Pages bukan sistem autentikasi server-side**. Artinya orang yang memiliki akses ke source code masih dapat memodifikasi JavaScript atau melewati password gate.

Jika password harus benar-benar rahasia, gunakan backend/authentication (misalnya Cloudflare Workers, Supabase Auth, Firebase Auth, atau server sendiri).

## Sumber materi

Konten soal dan pembahasan ditampilkan dari PDF yang diberikan untuk proyek ini. Gambar soal dan halaman pembahasan dipotong dan dikompresi dari PDF agar isi tetap setia pada sumber sekaligus ringan untuk GitHub Pages.
