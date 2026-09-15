import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 10MB payload for base64 receipt scans
  app.use(express.json({ limit: '10mb' }));

  // Lazy Gemini client helper
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return geminiClient;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // OCR Receipt Scanner Endpoint
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          error: 'Foto/gambar nota struk wajib disertakan (format base64).',
        });
      }

      const client = getGeminiClient();

      const prompt = `
Analisis foto nota/struk belanja atau bukti transaksi keuangan ini dengan teliti.
Ekstrak informasi kunci berikut:
1. "merchantName": Nama toko, merchant, kasir, restoran, penyedia jasa, atau pengirim/penerima (contoh: Indomaret, Alfamart, Tokopedia, Kopi Kenangan, SPBU Pertamina). Jika tidak tertera jelas, tebak dari header struk atau isi 'Toko/Merchant'.
2. "totalAmount": Total nominal pembayaran akhir (grand total) dalam angka bulat Rupiah (integer tanpa titik atau koma, e.g. 75000). Prioritaskan baris 'TOTAL', 'GRAND TOTAL', 'JUMLAH', 'TAGIHAN', atau 'HARGA TOTAL'.
3. "date": Tanggal transaksi dalam format standar YYYY-MM-DD (misal: '2026-09-15'). Jika hanya tertera hari/bulan atau tahun dua digit (misal: 15/09/26), konversikan ke format YYYY-MM-DD yang benar. Jika tanggal tidak ditemukan, gunakan tanggal hari ini.
4. "category": Rekomendasi kategori pengeluaran/pemasukan yang paling cocok dalam bahasa Indonesia, misalnya salah satu dari: 'Makanan & Minuman', 'Belanja Harian', 'Transportasi', 'Kesehatan', 'Hiburan', 'Tagihan & Utilitas', 'Pendidikan', 'Hasil Usaha', atau 'Lain-lain'.
5. "items": Daftar barang atau layanan yang dibeli jika terbaca (nama barang, kuantitas, harga satuan/total).
6. "notes": Ringkasan singkat keterangan nota (misal: "Belanja mingguan di Indomaret").
`;

      const cleanMimeType = mimeType || 'image/jpeg';
      // Strip data URL prefix if sent
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: cleanMimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchantName: {
                type: Type.STRING,
                description: 'Nama toko atau merchant pada struk',
              },
              totalAmount: {
                type: Type.NUMBER,
                description: 'Total nominal pembayaran akhir (dalam angka)',
              },
              date: {
                type: Type.STRING,
                description: 'Tanggal transaksi format YYYY-MM-DD',
              },
              category: {
                type: Type.STRING,
                description: 'Kategori pengeluaran yang cocok',
              },
              notes: {
                type: Type.STRING,
                description: 'Keterangan ringkas transaksi',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                  },
                },
                description: 'Rincian item produk/jasa yang dibeli jika ada',
              },
            },
            required: ['merchantName', 'totalAmount', 'date'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error scanning receipt:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gagal menganalisis foto nota/struk.',
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CatatCuan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
