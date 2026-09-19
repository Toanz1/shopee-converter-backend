import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Token và cookie Shopee lưu trong biến môi trường
const SHOPEE_COOKIE = process.env.SHOPEE_COOKIE || '';

app.post('/api/generate-link', async (req, res) => {
  const { originalUrl, subId } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Thiếu originalUrl' });
  }

  try {
    // Gọi thẳng vào GraphQL API của cổng Affiliate Shopee
    const response = await axios.post(
      'https://affiliate.shopee.vn/api/v3/gql',
      {
        operationName: 'batchCustomLink',
        query: `
          query batchCustomLink($linkParams: [CustomLinkParam!]!) {
            batchCustomLink(linkParams: $linkParams) {
              shortLink
              longLink
              failCode
            }
          }
        `,
        variables: {
          linkParams: [
            {
              originalLink: originalUrl,
              subIds: subId ? [subId] : [],
            },
          ],
        },
      },
      {
        headers: {
          'content-type': 'application/json',
          'cookie': SHOPEE_COOKIE,
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'referer': 'https://affiliate.shopee.vn/offer/custom_link',
        },
      }
    );

    const result = response.data?.data?.batchCustomLink?.[0];

    if (!result || !result.shortLink) {
      return res.status(500).json({
        error: 'Không thể tạo link',
        details: response.data,
      });
    }

    return res.json({
      success: true,
      shortLink: result.shortLink,
      longLink: result.longLink,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Lỗi kết nối tới Shopee API',
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Shopee Service đang chạy tại port ${PORT}`);
});