# Laporan Crosscheck Tryout dan Latihan SKD

**Status:** selesai — tidak ditemukan kerusakan penghambat pada alur utama yang diuji.

## Sumber acuan

- File: `Tryout Bimbel Batch 4 - 2026 #2.pdf`
- Struktur PDF: 224 halaman.
- Halaman soal: 4–113 (110 soal).
- Halaman kunci/pembahasan: 115–224 (110 nomor).

## Hasil pemeriksaan materi

- 110 record soal tersedia, nomor 1–110 berurutan.
- Distribusi: TWK 30, TIU 35, TKP 45.
- Setiap soal memiliki lima opsi A–E.
- Seluruh kunci berada pada A–E dan cocok dengan penanda jawaban benar pada halaman hasil PDF: **110/110**.
- Peta bobot opsi TKP dibandingkan dengan tampilan skor pada PDF: **45/45 soal**; setiap soal memiliki skor 1–5 dan satu opsi bernilai 5.
- Passing grade: TWK 65, TIU 80, TKP 166.
- Tabel numerik/soal cerita direpresentasikan sebagai tabel HTML/data, bukan screenshot halaman.
- Tujuh soal figural (59–65) menggunakan aset ilustrasi terpisah; halaman PDF penuh tidak dipakai sebagai gambar soal.

## Koreksi transkripsi OCR yang dilakukan

- Memperbaiki kata/angka pada soal 5, 8, 13, 19, 24, 51, 53, 59, 109, dan 110.
- Menghapus teks kategori antarmuka yang ikut terbaca OCR pada awal soal 109–110.
- Memperbaiki simbol hitung, angka, spasi, dan langkah pembahasan pada soal 40–58, termasuk pembagian, perkalian, persentase, tabel nilai, dan perhitungan deret.
- Membersihkan label opsi dan penanda pembahasan yang terduplikasi akibat OCR.

## Hasil uji fungsional browser

- Halaman login: nama peserta bebas + password bersama; password `luluscpns2027` diterima.
- Password salah ditolak.
- Dashboard, halaman persiapan, ruang CAT, navigator 110 nomor, dan halaman hasil berjalan.
- Seluruh 110 nomor dapat dinavigasi dan dijawab.
- Simulasi semua jawaban benar menghasilkan 550/550: TWK 150/150, TIU 175/175, TKP 225/225; seluruh passing grade tercapai.
- Uji bobot TKP: opsi 3 poin pada soal 66 menghasilkan 3 poin.
- Aset figural dan tabel soal diuji untuk memastikan dapat dimuat dan dirender.
- Timer, penyimpanan progres, serta pengakhiran saat waktu habis diuji.
- Pemeriksaan JavaScript dan JSON lulus; tidak ditemukan error JavaScript atau referensi aset lokal yang hilang pada paket.

## Catatan teknis

Website berjalan sebagai static site dan siap dipublikasikan melalui GitHub Pages. Penyimpanan hasil masih berada di browser peserta masing-masing; belum ada database terpusat atau panel admin untuk merekap nilai semua peserta. Password gate pada hosting statis bukan autentikasi server-side.


## Crosscheck tambahan — paket latihan TIU

**Sumber:** `Bonus Latihan Bimbel SKD CPNS #5 AYOCPNS.pdf` (150 halaman).

- 7 paket × 10 soal = **70 soal**.
- Setiap soal memiliki 5 opsi; total **350 opsi**, 70 kunci, dan 70 pembahasan.
- Durasi: 10 menit per paket; skor maksimal: 50 poin per paket.
- Semua soal, opsi, tabel, rumus, kunci, dan pembahasan dikonversi menjadi data teks terstruktur pada `data/practice.json`. Halaman latihan dan pembahasan merender teks/tabel HTML, bukan screenshot atau potongan gambar.
- Halaman soal dan pembahasan pada PDF:

| Paket | Materi | Halaman soal | Halaman pembahasan | Kunci sumber |
|---|---|---:|---:|---|
| 01 | Penalaran Logis | 4–13 | 15–24 | EACDECCEBC |
| 02 | Operasi Bilangan | 26–35 | 36–45 | DECDECDBEA |
| 03 | Analitis Kombinasi | 47–56 | 57–66 | CEBABCBEAD |
| 04 | Perbandingan (Kecukupan Data) | 68–77 | 78–87 | DDABCEDBAB |
| 05 | Aritmatika Sosial (Kecukupan Data) | 89–98 | 99–108 | BECADBCBAC |
| 06 | Jarak, Kecepatan, dan Waktu (Kecukupan Data) | 110–119 | 120–129 | CAECACDDDC |
| 07 | Deret | 131–140 | 141–150 | CCAAECCCDC |

- Seluruh **70 kunci** dicocokkan dengan penanda jawaban benar pada halaman pembahasan sumber: **70/70 sesuai**.
- Seluruh 70 soal memiliki lima opsi A–E. Paket yang memuat tabel numerik ditranskripsikan menjadi tabel HTML responsif agar angka dan kolom tetap terbaca pada ponsel.
- Pembahasan Deret nomor 6, 7, 8, dan 10 pada PDF tidak menampilkan seluruh langkah perhitungan. Langkah tambahan ditulis untuk melengkapi penjelasan berdasarkan pola yang ditunjukkan sumber; bagian tersebut merupakan elaborasi editor, bukan kutipan verbatim sumber.
- Progres latihan disimpan terpisah per identitas sesi peserta dan per paket. Timer menggunakan tenggat waktu absolut sehingga tetap berjalan saat halaman dimuat ulang atau ditinggalkan.

## Hasil pemeriksaan tampilan dan fungsi latihan

- Seluruh 7 kartu paket, 70 soal, 350 opsi, 70 kunci, dan 70 pembahasan tersedia dalam struktur data.
- Tidak ada lagi pemanggilan bundle gambar latihan atau elemen `<img>` untuk menampilkan soal, pilihan jawaban, maupun pembahasan.
- Login tetap menggunakan kolom Nama dan Password. Nama yang dimasukkan peserta ditampilkan kembali pada profil dan sesi latihan. Password yang diterima tetap `luluscpns2027`.
- Tampilan soal mendukung paragraf, pernyataan bernomor, daftar ketentuan, tabel, dan perhitungan.
- Tryout tidak diubah: `data/exam.json`, `data/questions.json`, serta alur pengerjaan Tryout dipertahankan.
- Timer, penyimpanan progres, penilaian, hasil, navigasi soal, dan halaman pembahasan latihan tetap menggunakan mekanisme yang sudah ada.
- Sintaks JavaScript dan parsing JSON diperiksa ulang setelah konversi. Uji browser akhir masih diperlukan pada deployment GitHub Pages yang sesungguhnya.

## Batas pemeriksaan

- Pemetaan halaman, isi soal, tabel, dan penanda kunci diperiksa dari PDF sumber. Pemeriksaan kunci menggunakan halaman pembahasan masing-masing paket.
- Pembahasan yang dilengkapi pada Deret nomor 6, 7, 8, dan 10 diberi langkah hitung eksplisit karena penjelasan pada PDF tidak lengkap.
- Website tetap merupakan static site. Progres dan hasil tersimpan pada browser peserta masing-masing; belum ada database terpusat atau panel admin untuk merekap nilai seluruh peserta.
- Password gate pada hosting statis bukan autentikasi server-side. Jangan menganggap password tersebut sebagai proteksi bank soal yang aman dari pemeriksaan source code.

## Finalisasi paket unduhan

- Teks login dirapikan menjadi instruksi masuk yang profesional tanpa keterangan bahwa nama dapat diisi bebas atau bahwa password hanya formalitas.
- Tujuh file bundle screenshot latihan (`practice-assets-p01.js` sampai `practice-assets-p07.js`) dihapus karena tidak lagi digunakan.
- Pemeriksaan statis final: 110 soal Tryout, 550 opsi, dan 110 pembahasan tetap tersedia. File Tryout tidak disentuh.
- Pemeriksaan paket latihan: 7 paket, 70 soal, 350 opsi, 70 kunci, dan 70 pembahasan tersedia dalam data terstruktur.
- `app.js` lolos pemeriksaan sintaks Node.js dan `data/practice.json` lolos parsing JSON.
- Deployment GitHub Pages belum diuji secara online; lakukan uji akhir setelah paket diunggah ke repository.
