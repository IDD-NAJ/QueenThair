import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Phone, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from '../utils/animations';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getHomepageCategoryShowcase } from '../services/homepageShowcaseService';
import { getActiveAnnouncements } from '../services/announcementService';
import { getCollections } from '../services/collectionService';
import { subscribeToNewsletter } from '../services/newsletterService';
import { newsletterSchema } from '../lib/validators/newsletterSchema';
import ProductCard from '../components/product/ProductCard';
import SectionHeader from '../components/common/SectionHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Img from '../components/common/Img';
import useStore from '../store/useStore';
import { resolveShowcaseTileMedia, isLikelyHttpUrl } from '../utils/categoryShowcase';

function HomepageCategoryTile({ to, title, description, imageUrl, videoUrl }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [vidFailed, setVidFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    setVidFailed(false);
  }, [imageUrl, videoUrl]);

  const canVideo = isLikelyHttpUrl(videoUrl) && !vidFailed;
  const canImage = isLikelyHttpUrl(imageUrl) && !imgFailed;

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={to}
        className="group relative aspect-[4/5] rounded-lg overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="relative w-full h-full min-h-[140px] bg-charcoal/15">
          {canVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={canImage ? imageUrl : undefined}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setVidFailed(true)}
            >
              <source src={videoUrl} />
            </video>
          ) : canImage ? (
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-charcoal/45 via-neutral-400/35 to-charcoal/40"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
            <h3 className="font-serif text-lg sm:text-xl text-white mb-1 group-hover:text-gold transition-colors duration-300">
              {title}
            </h3>
            {description && <p className="text-xs text-white/70 line-clamp-2">{description}</p>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryShowcase, setCategoryShowcase] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Refs for direct DOM manipulation — avoids re-renders on scroll
  const videoRefs = useRef([]);
  const heroContentRef = useRef(null);
  const rafRef = useRef(null);
  const lastScrollY = useRef(0);

  const navigate = useNavigate();
  const { showToast, user } = useStore();

  const heroVideos = [
    '/images/hero/4783775_Woman_Gym_1920x1080.mp4',
    '/images/hero/0_Friends_Hair_3840x2160.mp4'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [newArrivalsData, bestsellersData, featuredData, onSaleData, categoriesData, announcementsData, showcaseData] =
          await Promise.all([
            getProducts({ newArrival: true, limit: 8 }),
            getProducts({ bestSeller: true, limit: 8 }),
            getProducts({ featured: true, limit: 8 }),
            getProducts({ onSale: true, limit: 8 }),
            getCategories(),
            getActiveAnnouncements(),
            getHomepageCategoryShowcase().catch(() => null)
          ]);

        setNewArrivals(newArrivalsData.products || []);
        setBestsellers(bestsellersData.products || []);
        setFeatured(featuredData.products || []);
        setOnSale(onSaleData.products || []);
        setCategories(categoriesData || []);
        setAnnouncements(announcementsData || []);
        setCategoryShowcase(showcaseData);
        
        console.log('HomePage data loaded:', {
          newArrivals: newArrivalsData.products?.length || 0,
          bestsellers: bestsellersData.products?.length || 0,
          featured: featuredData.products?.length || 0,
          onSale: onSaleData.products?.length || 0,
          categories: categoriesData?.length || 0,
          announcements: announcementsData?.length || 0,
          categoryShowcase: showcaseData
            ? {
                items: (showcaseData.items || []).length,
                section_active: showcaseData.section_active,
              }
            : null,
        });
      } catch (error) {
        console.error('Failed to load home page data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  // Auto-switch hero videos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % heroVideos.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroVideos.length]);

  // RAF-throttled scroll handler — direct DOM mutations, zero React re-renders
  useEffect(() => {
    const onScroll = () => {
      lastScrollY.current = window.scrollY;
      if (rafRef.current) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const scrollY = lastScrollY.current;
        const heroHeight = 600;
        const scrollProgress = scrollY / heroHeight;

        // Mutate video elements directly
        videoRefs.current.forEach(video => {
          if (video) {
            video.style.transform = `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.001})`;
          }
        });

        // Mutate hero content directly
        if (heroContentRef.current) {
          const opacity = Math.max(0, 1 - scrollProgress * 1.5);
          const scale = Math.max(0.8, 1 - scrollProgress * 0.3);
          const ty = scrollY * 0.8;
          heroContentRef.current.style.opacity = opacity;
          heroContentRef.current.style.transform = `translateY(${ty}px) scale(${scale})`;
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // IntersectionObserver for section reveal — replaces getBoundingClientRect on scroll
  useEffect(() => {
    const sectionIds = ['promo-bar', 'categories', 'new-arrivals', 'bestsellers', 'featured', 'on-sale', 'newsletter'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => {
              if (prev.has(entry.target.id)) return prev; // no change
              const next = new Set(prev);
              next.add(entry.target.id);
              return next;
            });
            observer.unobserve(entry.target); // once revealed, stop watching
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNewsletterSubmit = async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await subscribeToNewsletter(data.email, {
        source: 'homepage_vip_list',
        userId: user?.id || null,
      });

      if (result.success) {
        showToast("You've been added to our VIP list!");
        reset();
      } else if (result.isDuplicate) {
        showToast('This email is already subscribed to our VIP list');
      } else {
        showToast(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showToast('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* HERO */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-[500px] sm:min-h-[600px] lg:h-[600px] overflow-hidden flex items-center"
      >
        {/* Video Background with parallax */}
        <div className="absolute inset-0 w-full h-full">
          {heroVideos.map((video, index) => (
              <video
                key={video}
                ref={el => { videoRefs.current[index] = el; }}
                autoPlay
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ 
                  filter: 'brightness(0.4)',
                  willChange: 'transform',
                }}
              >
                <source src={video} type="video/mp4" />
              </video>
            ))}
        </div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
        <div 
          ref={heroContentRef}
          className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-20 w-full py-16 sm:py-0"
          style={{ willChange: 'opacity, transform' }}
        >
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[11px] tracking-[0.2em] uppercase text-gold mb-4 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-gold" />
            2026 Luxury Collection
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-light text-white leading-tight mb-5"
          >
            Elevate Your<br />
            <strong className="font-medium italic text-gold-light">Natural Beauty</strong><br />
            With Premium Hair
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm sm:text-base text-white/60 max-w-[440px] mb-9 leading-relaxed"
          >
            Discover our handcrafted collection of human hair wigs and extensions. From silky straights to gorgeous curls — find your perfect style.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center"
          >
            <Button 
              to="/shop"
              variant="secondary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Shop Collection
            </Button>
            <Button 
              to="/collections/new-arrivals"
              variant="outline"
              size="lg"
              className="border-white/30 text-white/80 hover:border-white/70 hover:text-white hover:bg-transparent"
            >
              New Arrivals
            </Button>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="hidden lg:flex absolute bottom-10 right-20 gap-10"
        >
          {[
            { n: '50K+', l: 'Happy Customers' },
            { n: '2000+', l: 'Styles Available' },
            { n: '4.9★', l: 'Average Rating' }
          ].map((s, i) => (
            <div key={i} className="text-right">
              <div className="font-serif text-[32px] font-normal text-white leading-none">{s.n}</div>
              <div className="text-[11px] tracking-[0.1em] text-white/40 uppercase mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* PROMO BAR */}
      {announcements.length > 0 && (
        <motion.div 
          id="promo-bar"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-neutral-100 border-b border-border"
        >
          <div className="max-w-8xl mx-auto px-4 overflow-x-auto">
            <div className="flex items-center justify-center gap-6 sm:gap-8 py-3 min-w-max">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-center gap-2 text-xs text-text-secondary tracking-wider whitespace-nowrap">
                  {announcement.icon && (
                    <span className="text-gold">{announcement.icon}</span>
                  )}
                  {announcement.link ? (
                    <Link to={announcement.link} className="hidden sm:inline hover:text-charcoal transition-colors">
                      {announcement.title}
                    </Link>
                  ) : (
                    <span className="hidden sm:inline">{announcement.title}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* CATEGORIES — optional CMS via admin_settings (see Admin → Homepage categories) */}
      {(() => {
        const showcase = categoryShowcase;
        const sectionOn = showcase == null || showcase.section_active !== false;
        if (!sectionOn) return null;

        const headerTitle =
          showcase?.title && String(showcase.title).trim() ? showcase.title.trim() : 'Shop by Category';
        const headerSubtitle =
          showcase?.subtitle && String(showcase.subtitle).trim()
            ? showcase.subtitle.trim()
            : 'Find your perfect style';

        const customCards = (showcase?.items || [])
          .filter((i) => i.active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const useCustom = customCards.length > 0;

        return (
          <motion.section 
            id="categories" 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="py-12 sm:py-16 lg:py-20"
          >
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
              <SectionHeader title={headerTitle} subtitle={headerSubtitle} />
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              >
                {useCustom
                  ? customCards.map((item) => {
                      const { imageUrl, videoUrl } = resolveShowcaseTileMedia(item, categories);
                      return (
                        <HomepageCategoryTile
                          key={item.id}
                          to={item.href || '/shop'}
                          title={item.title || 'Category'}
                          description={item.description}
                          imageUrl={imageUrl}
                          videoUrl={videoUrl}
                        />
                      );
                    })
                  : categories.slice(0, 8).map((cat) => (
                      <HomepageCategoryTile
                        key={cat.id}
                        to={`/shop/${cat.slug}`}
                        title={cat.name}
                        description={cat.description}
                        imageUrl={cat.image_url?.trim() || ''}
                        videoUrl=""
                      />
                    ))}
              </motion.div>
            </div>
          </motion.section>
        );
      })()}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <motion.section 
          id="new-arrivals"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16 lg:py-20 bg-warm-white"
        >
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="New Arrivals"
              subtitle="Latest additions to our collection"
              action={{ label: 'View All', href: '/collections/new-arrivals' }}
            />
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <motion.section 
          id="bestsellers"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16 lg:py-20"
        >
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="Best Sellers"
              subtitle="Customer favorites"
              action={{ label: 'View All', href: '/collections/best-sellers' }}
            />
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <motion.section 
          id="featured"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16 lg:py-20 bg-warm-white"
        >
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="Featured Products"
              subtitle="Handpicked for you"
            />
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ON SALE */}
      {onSale.length > 0 && (
        <motion.section 
          id="on-sale"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="py-12 sm:py-16 lg:py-20"
        >
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="On Sale"
              subtitle="Limited time offers"
              action={{ label: 'View All', href: '/collections/sale' }}
            />
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* NEWSLETTER */}
      <motion.section 
        id="newsletter"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-charcoal via-dark-brown to-charcoal"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-serif text-3xl sm:text-4xl text-white mb-4"
          >
            Join Our VIP List
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-white/60 mb-8"
          >
            Get exclusive access to new arrivals, special offers, and hair care tips.
          </motion.p>
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={handleSubmit(handleNewsletterSubmit)} 
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                disabled={isSubmitting}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Email address"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 text-left" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              variant="secondary"
              disabled={isSubmitting}
              className="disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subscribing...
                </span>
              ) : (
                'Subscribe'
              )}
            </Button>
          </motion.form>
        </div>
      </motion.section>
    </div>
  );
}
