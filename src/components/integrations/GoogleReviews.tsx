'use client';

import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  hasResponse: boolean;
  existingResponse?: string;
}

// Données mock — l'API réelle nécessite OAuth Google Business Profile
const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-1',
    author: 'Sophie M.',
    rating: 5,
    date: '2026-07-10',
    text: 'Excellent restaurant ! Les plats sont délicieux et le service impeccable. Je recommande vivement le menu dégustation.',
    hasResponse: false,
  },
  {
    id: 'review-2',
    author: 'Jean-Pierre D.',
    rating: 4,
    date: '2026-07-08',
    text: 'Très bonne cuisine, cadre agréable. Le temps d\'attente était un peu long mais l\'accueil était chaleureux.',
    hasResponse: true,
    existingResponse: 'Merci pour votre retour positif, Jean-Pierre ! Nous travaillons sur la fluidité du service.',
  },
  {
    id: 'review-3',
    author: 'Marie-Claire B.',
    rating: 3,
    date: '2026-07-05',
    text: 'Correct mais pas exceptionnel. Le dessert était décevant par rapport au reste du repas.',
    hasResponse: false,
  },
  {
    id: 'review-4',
    author: 'Thomas R.',
    rating: 5,
    date: '2026-07-01',
    text: 'Une table magnifique pour notre anniversaire. Le chef est venu nous saluer, un moment magique !',
    hasResponse: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-text-muted'
          }`}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  restaurantName: string;
}

function ReviewCard({ review, restaurantName }: ReviewCardProps) {
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleGenerateResponse = async () => {
    setIsGenerating(true);
    try {
      const res = await authedFetch('/api/ai/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.text,
          rating: review.rating,
          restaurantName,
        }),
      });

      const data = await res.json() as { response?: string; error?: string };

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur lors de la generation');
        return;
      }

      setGeneratedResponse(data.response ?? '');
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    // TODO: Publication via API Google Business Profile
    // Nécessite OAuth GBP connecté + approbation Google Actions Center
    setIsApproved(true);
    toast.success('Réponse approuvée (publication GBP à connecter)');
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
      {/* En-tête de l'avis */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{review.author}</span>
            <span className="text-xs text-text-muted">{review.date}</span>
          </div>
          <StarRating rating={review.rating} />
        </div>
        {review.hasResponse && (
          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <ThumbsUp className="w-3 h-3" />
            Réponse publiée
          </span>
        )}
      </div>

      {/* Texte de l'avis */}
      <p className="text-sm text-text-secondary leading-relaxed">{review.text}</p>

      {/* Réponse existante */}
      {review.hasResponse && review.existingResponse && (
        <div className="rounded-xl bg-bg-primary border border-border p-3">
          <p className="text-xs font-semibold text-text-muted mb-1">Votre réponse :</p>
          <p className="text-sm text-text-secondary">{review.existingResponse}</p>
        </div>
      )}

      {/* Actions — uniquement pour les avis sans réponse */}
      {!review.hasResponse && (
        <div className="space-y-3">
          {!generatedResponse ? (
            <button
              onClick={handleGenerateResponse}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-primary text-text-primary text-sm font-medium hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {isGenerating ? 'Génération en cours...' : 'Générer une réponse IA'}
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
                Réponse générée (éditable)
              </label>
              <textarea
                value={generatedResponse}
                onChange={e => setGeneratedResponse(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isApproved}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {isApproved ? 'Approuvé' : 'Approuver'}
                </button>
                <button
                  onClick={handleGenerateResponse}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-primary text-text-primary text-sm font-medium hover:bg-bg-secondary transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Regénérer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GoogleReviewsProps {
  restaurantName?: string;
}

export default function GoogleReviews({ restaurantName = 'Mon Restaurant' }: GoogleReviewsProps) {
  const reviews = MOCK_REVIEWS;
  const pendingCount = reviews.filter(r => !r.hasResponse).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Avis Google</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} avis en attente de réponse`
              : 'Tous les avis ont une réponse'}
          </p>
        </div>
        <span className="text-xs bg-bg-secondary border border-border rounded-full px-3 py-1 text-text-muted font-medium">
          Données démo — API GBP via OAuth
        </span>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            restaurantName={restaurantName}
          />
        ))}
      </div>
    </div>
  );
}
