"""
Retriever Service: implements the full hybrid search + reranking pipeline.

This is the core of the production-grade RAG system. It combines three
retrieval strategies in sequence:

  1. VECTOR SEARCH (semantic) — finds chunks with similar *meaning* to the query
     using embeddings. Good at "database design" ≈ "schema architecture".

  2. BM25 SEARCH (keyword) — finds chunks with matching *words*. Good at exact
     terms like "PostgreSQL" or "React". Uses the BM25 algorithm (TF-IDF variant).

  3. RECIPROCAL RANK FUSION (RRF) — merges the two ranked lists into one.
     Each result gets a score based on its rank position in each list.
     This is better than simply averaging scores because vector and BM25
     scores are on different scales.

  4. CROSS-ENCODER RERANKING — takes the top fused results and re-scores
     each (query, chunk) pair using a cross-encoder model. Cross-encoders
     are more accurate than embedding similarity because they see the query
     and chunk *together* (not separately), but they're slower — which is
     why we only apply them to the top candidates, not the whole corpus.

Pipeline: Query → [Vector Search + BM25] → RRF Fusion → Reranker → Top K results
"""
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from app.config import settings
from app.services.embedding_service import embedding_service


class RetrieverService:
    """
    Hybrid retriever with BM25 + vector search, fusion, and reranking.
    """

    def __init__(self):
        # Cross-encoder model for reranking.
        # Unlike bi-encoders (which embed query and doc separately),
        # cross-encoders take (query, doc) as a single input and output
        # a relevance score. More accurate but O(n) per query-doc pair.
        self.reranker = CrossEncoder(settings.reranker_model)

    def bm25_search(
        self, query: str, chunks: list[str], n_results: int = 10
    ) -> list[dict]:
        """
        BM25 keyword search over a list of text chunks.

        BM25 (Best Matching 25) is a ranking function based on term frequency.
        It scores documents based on:
          - How often query terms appear in the document (TF)
          - How rare those terms are across all documents (IDF)
          - Document length normalization

        Args:
            query: Search query string.
            chunks: List of text chunks to search over.
            n_results: Number of top results to return.

        Returns:
            List of dicts with 'text', 'score', 'chunk_index'.
        """
        if not chunks:
            return []

        # Tokenize: split each chunk into lowercase words
        tokenized_chunks = [chunk.lower().split() for chunk in chunks]
        tokenized_query = query.lower().split()

        # Build BM25 index and score all chunks
        bm25 = BM25Okapi(tokenized_chunks)
        scores = bm25.get_scores(tokenized_query)

        # Get top-N indices sorted by score (descending)
        top_indices = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )[:n_results]

        return [
            {
                "text": chunks[i],
                "score": float(scores[i]),
                "chunk_index": i,
            }
            for i in top_indices
            if scores[i] > 0  # Only include chunks with non-zero relevance
        ]

    def reciprocal_rank_fusion(
        self,
        vector_results: list[dict],
        bm25_results: list[dict],
        k: int = 60,
    ) -> list[dict]:
        """
        Reciprocal Rank Fusion (RRF) — merges two ranked result lists.

        Formula: RRF_score(doc) = Σ 1 / (k + rank_in_list)

        Where k is a constant (default 60) that prevents high-ranked items
        from dominating. A doc ranked #1 in both lists gets:
          1/(60+1) + 1/(60+1) = 0.0328

        A doc ranked #1 in one list and #10 in the other gets:
          1/(60+1) + 1/(60+10) = 0.0307

        This naturally balances results from both retrieval methods
        without needing to normalize their different score scales.
        """
        fused_scores: dict[str, dict] = {}

        # Score each result from the vector search list
        for rank, result in enumerate(vector_results):
            text = result["text"]
            if text not in fused_scores:
                fused_scores[text] = {
                    "text": text,
                    "rrf_score": 0.0,
                    "chunk_index": result["chunk_index"],
                }
            fused_scores[text]["rrf_score"] += 1.0 / (k + rank + 1)

        # Score each result from the BM25 list
        for rank, result in enumerate(bm25_results):
            text = result["text"]
            if text not in fused_scores:
                fused_scores[text] = {
                    "text": text,
                    "rrf_score": 0.0,
                    "chunk_index": result["chunk_index"],
                }
            fused_scores[text]["rrf_score"] += 1.0 / (k + rank + 1)

        # Sort by fused score (descending)
        results = sorted(
            fused_scores.values(), key=lambda x: x["rrf_score"], reverse=True
        )
        return results

    def rerank(self, query: str, results: list[dict], top_k: int = 5) -> list[dict]:
        """
        Re-score results using a cross-encoder model.

        Cross-encoders process (query, document) pairs together through
        a transformer, producing a single relevance score. This is more
        accurate than bi-encoder similarity (used in vector search) because
        the model can attend to interactions between query and document tokens.

        The tradeoff: cross-encoders are ~100x slower than bi-encoders,
        so we only apply them to the top candidates from the fusion step.
        """
        if not results:
            return []

        # Create (query, chunk) pairs for the cross-encoder
        pairs = [(query, result["text"]) for result in results]

        # Score all pairs — returns a list of float scores
        scores = self.reranker.predict(pairs)

        # Attach reranker scores and sort
        for result, score in zip(results, scores):
            result["rerank_score"] = float(score)

        reranked = sorted(results, key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

    def hybrid_search(
        self,
        resume_id: str,
        query: str,
        n_vector: int = 10,
        n_bm25: int = 10,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Full hybrid retrieval pipeline:
        Query → [Vector + BM25] → RRF Fusion → Reranker → Top K

        This is the main entry point for retrieval. All other methods
        in this class are building blocks for this pipeline.

        Args:
            resume_id: Which resume's chunks to search.
            query: The search query (e.g., a skill requirement from a JD).
            n_vector: How many results to get from vector search.
            n_bm25: How many results to get from BM25 search.
            top_k: Final number of results after reranking.

        Returns:
            List of the top_k most relevant chunks, each with text and scores.
        """
        # Step 1: Get all chunks for BM25 (BM25 needs the full list)
        all_chunks = embedding_service.get_all_chunks(resume_id)
        if not all_chunks:
            return []

        # Step 2: Run both searches in parallel (conceptually — sequential here)
        vector_results = embedding_service.vector_search(resume_id, query, n_vector)
        bm25_results = self.bm25_search(query, all_chunks, n_bm25)

        # Step 3: Fuse results with Reciprocal Rank Fusion
        fused = self.reciprocal_rank_fusion(vector_results, bm25_results)

        # Step 4: Rerank the fused results with the cross-encoder
        # Only rerank the top candidates (reranking is expensive)
        candidates = fused[: max(top_k * 3, 15)]  # Take 3x more than we need
        reranked = self.rerank(query, candidates, top_k)

        return reranked


# Singleton instance
retriever_service = RetrieverService()
