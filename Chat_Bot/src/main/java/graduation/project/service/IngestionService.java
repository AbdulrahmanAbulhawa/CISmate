package graduation.project.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.ParagraphPdfDocumentReader;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class IngestionService implements CommandLineRunner {

    private final VectorStore vectorStore;

    // Hardcoded PDF path — no application.properties
    private final Resource pdf = new ClassPathResource("DOCS/CISmate_ChatBot(first).pdf");

    // Hardcoded ingestion toggle
    private final boolean AUTO_INGEST_ON_STARTUP = true;

    @Override
    public void run(String... args) {
        if (AUTO_INGEST_ON_STARTUP) {
            ingest();
        } else {
            log.info("⚙️ Auto-ingestion disabled (hardcoded). Skipping startup ingestion.");
        }
    }

    /**
     * Allows manual ingestion or startup ingestion.
     */
    public void ingest() {
        try {
            // STEP 1 — Check if vector store already has content
            if (isVectorStoreAlreadyPopulated()) {
                log.info("📚 Vector store already contains data. Skipping ingestion.");
                return;
            }

            // STEP 2 — Extract text from PDF
            List<Document> docs;

            try {
                var paraReader = new ParagraphPdfDocumentReader(pdf);
                docs = paraReader.get();
                log.info("Paragraph reader OK. Paragraphs: {}", docs.size());
            } catch (IllegalArgumentException e) {
                log.warn("Paragraph reader failed, using page reader.");
                var pageReader = new PagePdfDocumentReader(pdf);
                docs = pageReader.get();
                log.info("Page reader OK. Pages: {}", docs.size());
            }

            if (docs == null || docs.isEmpty()) {
                log.warn("No text extracted from PDF. Possibly scanned with no OCR.");
                return;
            }

            // STEP 3 — Split into chunks
            TextSplitter splitter = new TokenTextSplitter();
            var chunks = splitter.apply(docs);

            if (chunks.isEmpty()) {
                log.warn("Splitter produced 0 chunks.");
                return;
            }

            // STEP 4 — Save into vector store
            vectorStore.accept(chunks);
            log.info("✅ Successfully ingested {} chunks from {}", chunks.size(), pdf.getFilename());

        } catch (Exception ex) {
            log.error("❌ Ingestion failed: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Detects if vector store already has embeddings to avoid duplicate ingestion.
     */
    private boolean isVectorStoreAlreadyPopulated() {
        try {
            List<Document> existing = vectorStore.similaritySearch("hello");
            return existing != null && !existing.isEmpty();
        } catch (Exception e) {
            log.warn("Vector store pre-check failed: {}", e.getMessage());
            return false;
        }
    }
}
