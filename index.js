import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// 1. Thêm Route GET / để khi mở link không bị "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Shopee Converter Backend is running successfully!');
});

// 2. Endpoint Convert link Shopee / Lazada
app.post('/convert', async (req, res) => {
  try {
    const { url, subId } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Thiếu đường dẫn URL sản phẩm' });
    }

    let targetUrl = url.trim();

    // Tự động giải mã nếu là link rút gọn s.shopee.vn
    if (targetUrl.includes('s.shopee.vn') || targetUrl.includes('shp.ee')) {
      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        targetUrl = response.url || targetUrl;
      } catch (err) {
        console.error('Không thể bóc tách link rút gọn:', err);
      }
    }

    // Lấy Traffic ID MasOffer từ biến môi trường (hoặc fallback)
    const trafficId = process.env.MASOFFER_TRAFFIC_ID || 'TEST';
    const cleanUrl = targetUrl.split('?')[0];

    // Tạo Deeplink MasOffer chuẩn (không phụ thuộc Cookie)
    const affiliateUrl = `https://go.isclix.com/deep_link/v6/${trafficId}/shopee?url=${encodeURIComponent(
      cleanUrl
    )}&sub_id1=${encodeURIComponent(subId || 'guest')}`;

    return res.json({
      success: true,
      affiliateUrl,
      originalUrl: targetUrl,
    });
  } catch (error) {
    console.error('Lỗi xử lý convert:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ xử lý link' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});