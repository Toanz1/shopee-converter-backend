import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Điền API Key Camlink của bạn vào đây (hoặc cấu hình qua biến môi trường trên Render)
const CAMLINK_API_KEY = process.env.CAMLINK_API_KEY || 'clk_live_your_api_key';

app.get('/', (req, res) => {
  res.send('Shopee Converter Backend (Camlink API) is running!');
});

app.post('/convert', async (req, res) => {
  try {
    const { url, subId } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Thiếu đường dẫn URL sản phẩm' });
    }

    // Gửi request trực tiếp đến Camlink API
    const response = await fetch('https://apicam.hoantienz.com/api/v1/affiliate/convert-link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAMLINK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        original_links: [url.trim()],
        sub_id_1: String(subId || 'guest')
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Lỗi từ Camlink:', result);
      return res.status(response.status).json({ 
        error: result?.error?.message || 'Không thể tạo link qua Camlink' 
      });
    }

    // Trích xuất link tiếp thị từ phản hồi của Camlink
    const customLinks = result?.data?.data?.batchCustomLink;
    if (customLinks && customLinks.length > 0) {
      const generatedLink = customLinks[0].shortLink || customLinks[0].longLink;
      return res.json({
        success: true,
        affiliateUrl: generatedLink,
        originalUrl: url
      });
    }

    return res.status(400).json({ error: 'Không nhận được link chuyển đổi từ Camlink' });

  } catch (error) {
    console.error('Lỗi server xử lý convert:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ kết nối Camlink API' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});