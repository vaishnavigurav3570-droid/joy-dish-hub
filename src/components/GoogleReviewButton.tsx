import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=YOUR_GOOGLE_PLACE_ID_HERE';

const GoogleReviewButton = () => (
  <motion.a
    href={GOOGLE_REVIEW_URL}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all"
    style={{
      background: 'linear-gradient(135deg, #FBBC05 0%, #F59E0B 50%, #EA4335 100%)',
      color: '#fff',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }}
  >
    <span className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-white text-white" />
      ))}
    </span>
    ⭐ Rate us 5 Stars on Google!
  </motion.a>
);

export default GoogleReviewButton;
