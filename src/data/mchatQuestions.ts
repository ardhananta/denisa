export interface ScreeningQuestion {
  id: number;
  text: string;
  example?: string;
  category?: string;
}

export const MCHAT_RF_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 1,
    text: 'Jika Anda menunjuk sesuatu di seberang ruangan, apakah anak Anda melihat ke arah benda tersebut?',
    example: 'Contoh: menunjuk mainan atau cicak di dinding, si kecil langsung menoleh melihatnya.',
  },
  {
    id: 2,
    text: 'Pernahkah Anda merasa ragu atau khawatir bahwa anak Anda mungkin tuli atau ada gangguan pendengaran?',
    example: 'Sering tidak merespons saat dipanggil atau ada suara keras.',
  },
  {
    id: 3,
    text: 'Apakah anak Anda suka bermain pura-pura atau sandiwara?',
    example: 'Contoh: pura-pura minum dari cangkir kosong, pura-pura menelepon, atau menyuapi boneka.',
  },
  {
    id: 4,
    text: 'Apakah anak Anda suka memanjat benda-benda di sekitarnya?',
    example: 'Contoh: menaiki perabot rumah, sofa, tangga, atau wahana bermain.',
  },
  {
    id: 5,
    text: 'Apakah anak Anda menggerakkan jari-jemarinya secara tidak wajar di dekat matanya?',
    example: 'Contoh: melambai-lambaikan jari di depan mata secara berulang-ulang.',
  },
  {
    id: 6,
    text: 'Apakah anak Anda menunjuk dengan satu jari untuk meminta sesuatu atau meminta bantuan?',
    example: 'Contoh: menunjuk makanan atau mainan di tempat tinggi yang tidak terjangkau.',
  },
  {
    id: 7,
    text: 'Apakah anak Anda menunjuk dengan satu jari untuk memperlihatkan sesuatu yang menarik kepada Anda?',
    example: 'Contoh: menunjuk pesawat terbang di langit atau hewan lucu di jalan.',
  },
  {
    id: 8,
    text: 'Apakah anak Anda tertarik dan antusias berinteraksi dengan anak-anak lain?',
    example: 'Contoh: memperhatikan anak lain bermain, tersenyum, atau mendekati mereka.',
  },
  {
    id: 9,
    text: 'Apakah anak Anda memperlihatkan benda-benda kepada Anda dengan membawanya ke arah Anda?',
    example: 'Bukan untuk meminta bantuan, tapi hanya untuk membagikan ketertarikan/kesenangan pada Anda.',
  },
  {
    id: 10,
    text: 'Apakah anak Anda merespons saat namanya dipanggil?',
    example: 'Contoh: menoleh, menatap wajah Anda, atau menghentikan aktivitasnya sejenak.',
  },
  {
    id: 11,
    text: 'Saat Anda tersenyum pada anak Anda, apakah dia tersenyum kembali kepada Anda?',
    example: 'Merespons senyuman hangat dengan senyuman spontan.',
  },
  {
    id: 12,
    text: 'Apakah anak Anda merasa sangat terganggu atau cemas oleh suara-suara bising sehari-hari?',
    example: 'Contoh: menangis atau menutup telinga saat mendengar blender, vacuum cleaner, atau hair dryer.',
  },
  {
    id: 13,
    text: 'Apakah anak Anda sudah bisa berjalan sendiri tanpa bantuan?',
    example: 'Dapat melangkah mandiri tanpa harus dipegangi.',
  },
  {
    id: 14,
    text: 'Apakah anak Anda menatap mata Anda saat Anda berbicara dengannya, bermain, atau memakaikan baju?',
    example: 'Kontak mata yang alami dan bertahan beberapa detik.',
  },
  {
    id: 15,
    text: 'Apakah anak Anda mencoba meniru apa yang Anda lakukan?',
    example: 'Contoh: melambaikan tangan dadaa, bertepuk tangan, atau menirukan suara lucu.',
  },
  {
    id: 16,
    text: 'Jika Anda menoleh untuk melihat sesuatu, apakah anak Anda ikut menoleh untuk melihat apa yang Anda lihat?',
    example: 'Mengikuti arah pandangan mata Anda (joint attention).',
  },
  {
    id: 17,
    text: 'Apakah anak Anda mencoba membuat Anda memperhatikannya?',
    example: 'Contoh: menatap Anda untuk dipuji, atau berkata "lihat ini!", atau menarik tangan Anda.',
  },
  {
    id: 18,
    text: 'Apakah anak Anda memahami saat Anda memintanya melakukan sesuatu sederhana tanpa bahasa isyarat?',
    example: 'Contoh: "ambil sepatumu" atau "taruh cangkir di meja" hanya dengan kata-kata.',
  },
  {
    id: 19,
    text: 'Jika sesuatu yang baru atau mengejutkan terjadi, apakah anak Anda melihat wajah Anda untuk melihat reaksi Anda?',
    example: 'Contoh: saat mendengar suara baru, dia melihat ekspresi wajah Anda untuk memastikan apakah aman.',
  },
  {
    id: 20,
    text: 'Apakah anak Anda menyukai aktivitas fisik yang melibatkan gerakan?',
    example: 'Contoh: diayun-ayun, melompat di pangkuan Anda, atau digendong meluncur.',
  },
];
