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
- Setiap soal memiliki 5 opsi; total 350 opsi, 70 kunci, dan 70 gambar pembahasan.
- Durasi: 10 menit per paket; skor maksimal: 50 poin per paket.
- Seluruh 490 potongan WebP (70 stimulus soal, 350 opsi, 70 pembahasan) diambil dari bundel materi yang sebelumnya dicocokkan dengan PDF sumber. Bundel latihan dipisah menjadi 7 file JavaScript yang dimuat saat paket dipilih.
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

- Catatan sumber: pembahasan Deret nomor 6, 7, 8, dan 10 tidak lengkap pada PDF. Konten sumber tidak diganti. Penjelasan hitungan tambahan ditampilkan pada blok terpisah dan diberi label sebagai tambahan.
- Progres latihan disimpan terpisah per identitas sesi peserta dan per paket. Timer menggunakan tenggat waktu absolut sehingga tetap berjalan saat halaman dimuat ulang atau ditinggalkan.

## Batas pemeriksaan paket latihan

- Pemetaan halaman, nomor soal, nama paket, dan kunci mengikuti metadata latihan yang telah diaudit sebelumnya; halaman sumber untuk paket pertama, kedua, ketiga, keempat, kelima, keenam, dan ketujuh diperiksa secara visual pada PDF yang tersedia di percakapan ini.
- Paket latihan menggunakan potongan visual dari sumber untuk menjaga kesetiaan teks dan tabel; tidak diklaim sebagai transkripsi teks yang dapat diedit.
- Uji browser Chromium terkontrol: seluruh 7 kartu paket tampil; alur Paket Jarak, Kecepatan, dan Waktu diuji dari persiapan, mulai, memilih jawaban, navigasi, penyelesaian, hasil, sampai pembahasan. Paket Deret nomor 6 diuji untuk pemisahan catatan tambahan.
- Uji timer otomatis: paket berubah ke halaman hasil ketika batas 10 menit tercapai. Uji tampilan pada lebar 1280 px dan 390 px; tidak ditemukan horizontal overflow halaman. Console/page errors pada uji terkontrol: 0.
- Uji pada URL GitHub Pages sesungguhnya masih perlu dilakukan setelah file dipublikasikan. Pemeriksaan browser dilakukan pada harness Chromium terkontrol dengan data dan aset lokal; hasil tersebut tidak membuktikan deployment online sudah berjalan.


## Finalisasi paket unduhan

- Keterangan atribusi/sumber materi dihapus dari seluruh tampilan peserta (dashboard latihan, persiapan, dan halaman pembahasan). Informasi provenance tetap disimpan dalam dokumentasi pengembang `AUDIT.md` untuk keperluan penelusuran dan pemeliharaan.
- Teks pengantar latihan diperbarui menjadi deskripsi netral tanpa menyebut file sumber.
- Metadata sumber yang tidak digunakan oleh aplikasi dihapus dari `data/practice.json`.
- Pemeriksaan statis final: 110 soal Tryout, 550 opsi, 110 pembahasan; 45 soal TKP memiliki lima bobot opsi 1–5.
- Pemeriksaan paket latihan: 7 paket, 70 soal, 350 opsi, 70 kunci, 70 pembahasan, serta 490 aset WebP individual terpetakan ke seluruh soal/opsi/pembahasan.
- Sintaks `app.js`, struktur JSON, dan pemetaan seluruh aset latihan diperiksa ulang setelah perubahan tampilan.
- Uji browser lokal tambahan pada sesi final tidak dapat dijalankan karena akses Chromium ke server lokal diblokir oleh kebijakan lingkungan. Karena itu, hasil final ini tidak mengklaim deployment GitHub Pages telah diuji secara online.
