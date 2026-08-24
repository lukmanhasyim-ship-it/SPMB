export const DATA_JURUSAN = [
  { value: 'PPLG', label: 'PPLG - Pengembangan Perangkat Lunak dan Gim' },
  { value: 'TJKT', label: 'TJKT - Teknik Jaringan Komputer dan Telekomunikasi' },
  { value: 'TO', label: 'TO - Teknik Otomotif' },
  { value: 'AKL', label: 'AKL - Akuntansi dan Keuangan Lembaga' },
  { value: 'Busana', label: 'Busana - Tata Busana' },
] as const

export const DATA_AGAMA = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
]

export const DATA_TINGGAL_BERSAMA = [
  'Orang Tua',
  'Wali',
  'Pondok',
]

export const DATA_KATEGORI_REFERRAL = [
  { value: 'Guru SMKS AL AZHAR SEMPU', label: 'Guru SMKS AL AZHAR SEMPU' },
  { value: 'Guru SMP/MTs', label: 'Guru SMP/MTs' },
  { value: 'Siswa Kelas X', label: 'Siswa Kelas X' },
  { value: 'Siswa Kelas XI', label: 'Siswa Kelas XI' },
  { value: 'Siswa Kelas XII', label: 'Siswa Kelas XII' },
  { value: 'Alumni', label: 'Alumni' },
  { value: 'Lainnya', label: 'Lainnya' },
]

export const DATA_PROSPEK_KARIR: Record<string, string[]> = {
  PPLG: [
    'Jadi Programmer Handal yang Dicari Banyak Perusahaan',
    'Membangun Website & Aplikasi Android Keren',
    'Menciptakan Game Seru yang Dimainkan Ribuan Orang',
    'Software Engineer / Developer Profesional',
    'UI/UX Designer — Mendesain Tampilan Aplikasi yang Menarik',
    'QA Tester — Memastikan Aplikasi Bebas dari Bug',
    'Data Analyst — Mengolah Data Menjadi Informasi Berharga',
    'Jadi Bos Startup / Freelancer Berpenghasilan Tinggi',
    'Dapat Melanjutkan ke Perguruan Tinggi yang Relevan',
  ],
  TJKT: [
    'Jadi Ahli Jaringan yang Menghubungkan Seluruh Dunia',
    'Network Administrator & Engineer Perusahaan',
    'Cyber Security — Melindungi Data dari Serangan Hacker',
    'Teknisi Fiber Optic Internet Cepat',
    'IT Support — Tempat Orang Bertanya soal Komputer',
    'Teknisi Komputer, Laptop, dan Perangkat Jaringan',
    'Cloud Engineer — Kelola Server Teknologi Modern',
    'Buka Jasa Instalasi & Perawatan Jaringan Sendiri',
    'Dapat Melanjutkan ke Perguruan Tinggi yang Relevan',
  ],
  TO: [
    'Jadi Mekanik Andal di Bengkel Ternama',
    'Teknisi Motor Injeksi & Kendaraan Masa Kini',
    'Ahli Perawatan Mesin Diesel dan Industri',
    'Service Advisor — Ahli Diagnosa Kendaraan',
    'Punya Bengkel Sendiri dan Menjadi Bos',
    'Teknisi Modifikasi & Peningkatan Performa Kendaraan',
    'Karier di Industri Otomotif Besar (Dealer/Pabrik)',
    'Sales & After-Sales Produk Otomotif',
    'Dapat Melanjutkan ke Perguruan Tinggi yang Relevan',
  ],
  AKL: [
    'Jadi Staf Akuntansi yang Jeli dan Teliti',
    'Junior Accountant — Gerbang Karier di Dunia Keuangan',
    'Bendahara dan Pengelola Keuangan Organisasi',
    'Staf Perpajakan — Ahli Hitung Pajak',
    'Kasir & Teller Bank — Karier di Dunia Perbankan',
    'Internal Auditor — Pengawas Keuangan Perusahaan',
    'Analis Keuangan dengan Prospek Cerah',
    'Karier Stabil di Perusahaan hingga BUMN',
    'Dapat Melanjutkan ke Perguruan Tinggi yang Relevan',
  ],
  Busana: [
    'Jadi Desainer Busana dengan Karyamu Sendiri',
    'Menjahit & Mendesain Baju Sesuai Tren',
    'Modiste Busana Muslim yang Diminati Banyak Orang',
    'Pattern Maker — Ahli Cetak Pola Pakaian',
    'Buka Butik / Konveksi dan Jadi Bos Bisnis',
    'Stylist — Penata Penampilan Para Klien',
    'Quality Control di Industri Garmen',
    'Berkarier di Dunia Fashion & Runway',
    'Dapat Melanjutkan ke Perguruan Tinggi yang Relevan',
  ],
}

export const DATA_JENIS_IZIN = ['Sakit', 'Keperluan Keluarga', 'Lainnya']
