# rooster

Contoh implementasi **FullCalendar Timeline** menggunakan React + Vite.

## Fitur

- View timeline per hari, minggu, dan bulan
- Resource scheduling (contoh: Ruang A, B, C, D)
- Data event awal siap pakai
- Perubahan data tersimpan di `localStorage` browser dan tetap ada setelah refresh
- UI responsive untuk desktop dan mobile

## Menjalankan Project

1. Install dependency:

```bash
npm install
```

2. Jalankan mode development:

```bash
npm run dev
```

3. Build production:

```bash
npm run build
```

4. Preview hasil build:

```bash
npm run preview
```

## Catatan

Project ini saat ini belum terhubung ke database atau backend API. Penyimpanan data masih menggunakan `localStorage` di browser pengguna.

Project ini memakai plugin timeline dari FullCalendar dengan lisensi:

`GPL-My-Project-Is-Open-Source`