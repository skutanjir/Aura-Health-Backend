import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Seed education content
  const educationData = [
    {
      title: 'Apa itu TBC?',
      content: 'Tuberkulosis (TBC) adalah penyakit infeksi menular yang disebabkan oleh bakteri Mycobacterium tuberculosis. Bakteri ini terutama menyerang paru-paru, namun dapat juga menyerang organ tubuh lain seperti ginjal, tulang belakang, dan otak.',
      category: 'Pengenalan TBC',
      order: 1,
    },
    {
      title: 'Gejala TBC',
      content: 'Gejala utama TBC meliputi: batuk lebih dari 2 minggu, batuk berdarah, demam subfebris terutama malam hari, berkeringat malam, penurunan berat badan drastis, nafsu makan berkurang, dan rasa lelah berlebihan.',
      category: 'Gejala',
      order: 1,
    },
    {
      title: 'Cara Penularan TBC',
      content: 'TBC menular melalui udara ketika penderita TBC aktif batuk, bersin, atau berbicara. Droplet yang mengandung bakteri terhirup oleh orang lain. TBC TIDAK menular melalui sentuhan, berbagi makanan, atau kontak fisik.',
      category: 'Penularan',
      order: 1,
    },
    {
      title: 'Pengobatan TBC',
      content: 'TBC dapat disembuhkan dengan Obat Anti Tuberkulosis (OAT) yang diminum rutin selama minimal 6 bulan. Kombinasi obat terdiri dari: Isoniazid (H), Rifampisin (R), Pirazinamid (Z), dan Etambutol (E). Penting untuk tidak menghentikan pengobatan meskipun sudah merasa sehat.',
      category: 'Pengobatan',
      order: 1,
    },
    {
      title: 'Pencegahan TBC',
      content: 'Pencegahan TBC meliputi: vaksin BCG untuk bayi baru lahir, ventilasi rumah yang baik, etika batuk (tutup mulut), tidak meludah sembarangan, makan bergizi, olahraga teratur, dan segera berobat jika ada gejala.',
      category: 'Pencegahan',
      order: 1,
    },
    {
      title: 'TBC Resistan Obat (MDR-TBC)',
      content: 'MDR-TBC adalah TBC yang resistan terhadap setidaknya Isoniazid dan Rifampisin. Penyebabnya adalah pengobatan yang tidak tuntas atau tidak teratur. Penanganan MDR-TBC memerlukan obat lini kedua selama 18-24 bulan.',
      category: 'TBC Resistan',
      order: 1,
    },
  ];

  for (const data of educationData) {
    await prisma.educationContent.upsert({
      where: { id: data.title.toLowerCase().replace(/\s+/g, '-') },
      update: data,
      create: { id: data.title.toLowerCase().replace(/\s+/g, '-'), ...data },
    });
  }

  // Seed sample articles
  const articleData = [
    {
      title: 'Mengenal TBC: Penyakit Lama yang Masih Jadi Ancaman',
      content: 'Tuberkulosis masih menjadi salah satu penyakit menular paling mematikan di dunia...',
      summary: 'TBC masih menjadi ancaman kesehatan global yang perlu diwaspadai.',
      category: 'Edukasi',
      author: 'Tim Aura Health',
    },
    {
      title: '6 Tanda Anda Harus Segera Periksa TBC',
      content: 'Deteksi dini TBC sangat penting untuk keberhasilan pengobatan...',
      summary: 'Kenali tanda-tanda TBC sejak dini untuk penanganan yang lebih baik.',
      category: 'Gejala',
      author: 'Tim Aura Health',
    },
    {
      title: 'Mitos dan Fakta Seputar TBC',
      content: 'Masih banyak mitos yang beredar di masyarakat tentang TBC...',
      summary: 'Luruskan pemahaman Anda tentang TBC dengan fakta yang benar.',
      category: 'Edukasi',
      author: 'Tim Aura Health',
    },
  ];

  for (const data of articleData) {
    await prisma.article.create({ data }).catch(() => {});
  }

  console.log('✅ Seed completed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
