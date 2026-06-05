"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/ScriptedConsultBot.module.css";

type Message = {
  role: "bot" | "user";
  content: string;
  products?: ProductSuggestion[];
  links?: LinkSuggestion[];
};

type ProductSuggestion = {
  name: string;
  price?: string;
  url: string;
};

type LinkSuggestion = {
  name: string;
  summary?: string;
  url: string;
};

const AUTO_OPEN_DELAY_MS = 7000;

const replies: Record<string, string> = {
  "Tủ locker / tủ văn phòng":
    "Tủ locker nên chọn theo số ngăn, kích thước và nơi sử dụng như văn phòng, trường học, siêu thị. Bạn cho shop biết số lượng tủ, số ngăn cần dùng và địa chỉ giao để báo mẫu phù hợp.",
  "Bàn ghế văn phòng":
    "Bàn ghế văn phòng nên chọn theo diện tích phòng, số nhân viên và ngân sách. Shop có bàn làm việc, bàn họp, cụm bàn, ghế xoay, ghế chân quỳ. Bạn gửi số lượng cần mua để shop tư vấn nhanh.",
  "Nội thất trường học":
    "Nội thất trường học cần bền, dễ vệ sinh và đúng kích thước sử dụng. Shop có bàn ghế học sinh, bàn ghế giáo viên, bảng từ. Bạn cho biết cấp học và số lượng cần đặt nhé.",
  "Sofa / nội thất gia đình":
    "Nhóm gia đình có sofa, bàn ghế ăn, tủ giày, tủ quần áo, giường, kệ tivi. Bạn gửi kích thước phòng hoặc ảnh không gian để shop gợi ý mẫu dễ phối.",
  "Báo giá số lượng lớn":
    "Với đơn số lượng lớn, shop có thể tư vấn mẫu tối ưu chi phí và giao theo lịch. Bạn gửi danh sách sản phẩm, số lượng và địa chỉ giao để nhận báo giá nhanh."
};

export default function ScriptedConsultBot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Chào bạn, Hùng Ngọc có thể tư vấn nhanh theo nhu cầu. Bạn đang cần nhóm sản phẩm nào?"
    }
  ]);

  useEffect(() => {
    setIsVisible(true);

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const chooseTopic = (topic: string) => {
    setSelectedTopic(topic);
    setMessages((current) => [
      ...current,
      { role: "user", content: topic },
      { role: "bot", content: replies[topic] }
    ]);
  };

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  const getProductSuggestions = (): ProductSuggestion[] => {
    if (typeof document === "undefined") return [];

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/san-pham/"]'));
    const seen = new Set<string>();

    return links
      .map((link) => {
        const card = link.closest("article") || link.parentElement;
        const lines = (card?.textContent || link.textContent || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const name =
          lines.find((line) => /HN\d+|locker|bàn|ghế|tủ|sofa/i.test(line)) ||
          link.getAttribute("title")?.replace(/^Chi tiết sản phẩm\s*/i, "") ||
          "";
        const price = lines.find((line) => /\d[\d.]*\s*đ|liên hệ báo giá/i.test(line));
        const url = link.href;

        return { name, price, url };
      })
      .filter((product) => {
        if (!product.name || seen.has(product.url)) return false;
        seen.add(product.url);
        return true;
      })
      .slice(0, 12);
  };

  const getPageBasedReply = (question: string) => {
    const normalizedQuestion = normalizeText(question);
    const productSuggestions = getProductSuggestions();
    const terms = normalizedQuestion
      .split(/\s+/)
      .filter((term) => term.length >= 3)
      .slice(0, 8);

    const productMatches = productSuggestions.filter((product) => {
      const normalizedLine = normalizeText(`${product.name} ${product.price || ""}`);
      return terms.some((term) => normalizedLine.includes(term));
    });

    if (productMatches.length > 0) {
      return {
        content:
          "Trên trang hiện tại có vài mẫu liên quan. Bạn có thể bấm xem sản phẩm hoặc gửi Zalo để shop tư vấn mẫu phù hợp hơn.",
        products: productMatches.slice(0, 3)
      };
    }

    if (normalizedQuestion.includes("gia") || normalizedQuestion.includes("bao gia")) {
      return {
        content:
          "Giá sẽ phụ thuộc mẫu, kích thước, chất liệu và số lượng. Bạn có thể bấm xem sản phẩm đang hiện trên trang hoặc gửi Zalo để shop báo giá sát hơn.",
        products: productSuggestions.slice(0, 3)
      };
    }

    if (normalizedQuestion.includes("locker") || normalizedQuestion.includes("tu")) {
      const lockerItems = productSuggestions
        .filter((product) => /locker|tủ/i.test(product.name))
        .slice(0, 3);
      return {
        content: replies["Tủ locker / tủ văn phòng"],
        products: lockerItems
      };
    }

    if (normalizedQuestion.includes("ban") || normalizedQuestion.includes("ghe")) {
      const officeItems = productSuggestions
        .filter((product) => /bàn|ghế/i.test(product.name))
        .slice(0, 3);
      return {
        content: replies["Bàn ghế văn phòng"],
        products: officeItems
      };
    }

    if (normalizedQuestion.includes("giao") || normalizedQuestion.includes("van chuyen")) {
      return {
        content:
          "Shop hỗ trợ giao hàng tại Hà Nội và các khu vực lân cận. Bạn cho biết địa chỉ giao, số lượng và sản phẩm cần mua để shop tư vấn phí vận chuyển."
      };
    }

    return {
      content:
        "Mình có thể hỗ trợ tìm mẫu, gợi ý nhóm sản phẩm, báo thông tin trên website và chuyển bạn sang Zalo để nhân viên tư vấn chi tiết. Bạn đang quan tâm sản phẩm nào?",
      products: productSuggestions.slice(0, 3)
    };
  };

  const sendQuestion = async () => {
    const question = userInput.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: question },
      { role: "bot", content: "Mình đang tìm thông tin trên website..." }
    ]);
    setUserInput("");

    try {
      const response = await fetch("/api/consult-bot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, context: selectedTopic })
      });
      const data = await response.json();
      const links = [
        ...(data.categories || []),
        ...(data.posts || []),
        ...(data.policies || [])
      ].map((item: any) => ({
        name: item.name || item.title,
        summary: item.summary,
        url: item.url
      }));

      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "bot",
          content: data.answer || "Mình đã tìm trên website nhưng chưa thấy kết quả thật sát.",
          products: data.products || [],
          links
        }
      ]);
    } catch {
      const reply = getPageBasedReply(question);
      setMessages((current) => [
        ...current.slice(0, -1),
        { role: "bot", content: reply.content, products: reply.products }
      ]);
    }
  };

  const openZalo = () => {
    const latestNeed = messages
      .filter((item) => item.role === "user")
      .map((item) => item.content)
      .pop();
    const text = `Chào Nội Thất Hùng Ngọc, tôi cần tư vấn${
      latestNeed ? ` về ${latestNeed}` : " sản phẩm"
    }. Shop hỗ trợ báo mẫu và giá giúp tôi.`;

    window.open(`https://zalo.me/0347227377?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className={`${styles.wrapper} ${isVisible ? styles.wrapperVisible : ""}`}>
      {isOpen && (
        <section className={styles.panel} aria-label="Hỗ trợ Hùng Ngọc">
          <div className={styles.header}>
            <span>Hỗ trợ Hùng Ngọc</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng hỗ trợ">
              ×
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.messages}>
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`${styles.message} ${
                    message.role === "user" ? styles.userMessage : styles.botMessage
                  }`}
                >
                  {message.content}
                  {message.products && message.products.length > 0 && (
                    <div className={styles.productSuggestions}>
                      {message.products.map((product) => (
                        <a key={product.url} href={product.url} className={styles.productLink}>
                          <strong>{product.name}</strong>
                          {product.price && <span>{product.price}</span>}
                          <em>Xem sản phẩm</em>
                        </a>
                      ))}
                    </div>
                  )}
                  {message.links && message.links.length > 0 && (
                    <div className={styles.productSuggestions}>
                      {message.links.map((link) => (
                        <a key={link.url} href={link.url} className={styles.productLink}>
                          <strong>{link.name}</strong>
                          {link.summary && <span>{link.summary.slice(0, 90)}</span>}
                          <em>Mở trang liên quan</em>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.options}>
              {Object.keys(replies).map((topic) => (
                <button key={topic} type="button" onClick={() => chooseTopic(topic)}>
                  {topic}
                </button>
              ))}
            </div>

            <div className={styles.inputRow}>
              <textarea
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendQuestion();
                  }
                }}
                placeholder="Nhập câu hỏi của bạn..."
              />
              <button type="button" onClick={sendQuestion}>
                Gửi
              </button>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={openZalo}>
                Gửi qua Zalo
              </button>
              <a href="tel:0347227377">Gọi hotline</a>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => {
          setIsVisible(true);
          setIsOpen((current) => !current);
        }}
        aria-label="Mở hỗ trợ Hùng Ngọc"
      >
        <svg className={styles.launcherIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4.8 5.2h14.4c1 0 1.8.8 1.8 1.8v8.2c0 1-.8 1.8-1.8 1.8H9.7l-4.4 3.1c-.6.4-1.3 0-1.3-.7V7c0-1 .8-1.8 1.8-1.8Z" />
          <path d="M8.1 10.8h7.8M8.1 13.8h4.8" />
        </svg>
      </button>
    </div>
  );
}
