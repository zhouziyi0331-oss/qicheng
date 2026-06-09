import { Router } from 'express';
import {
  getOPCStories,
  reviewOPCStory,
  deleteOPCStory,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from './contentController';

const router = Router();

// OPC故事墙
router.get('/stories', getOPCStories);
router.post('/stories/:id/review', reviewOPCStory);
router.delete('/stories/:id', deleteOPCStory);

// 公告管理
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.post('/announcements/:id/publish', publishAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// 轮播图管理
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
