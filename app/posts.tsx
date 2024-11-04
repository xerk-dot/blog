"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import useSWR from "swr";
import { JetBrains_Mono } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
});


type SortSetting = ["date" | "views", "desc" | "asc"];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Posts({ posts: initialPosts }) {
  const [sort, setSort] = useState<SortSetting>(["date", "desc"]);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [highlightedImage, setHighlightedImage] = useState<string>("https://placehold.co/700x700");
  const { data: posts } = useSWR("/api/posts", fetcher, {
    fallbackData: initialPosts,
    refreshInterval: 5000,
  });

  function sortDate() {
    setSort(sort => [
      "date",
      sort[0] !== "date" || sort[1] === "asc" ? "desc" : "asc",
    ]);
  }

  function sortViews() {
    setSort(sort => [
      sort[0] === "views" && sort[1] === "asc" ? "date" : "views",
      sort[0] !== "views" ? "desc" : sort[1] === "asc" ? "desc" : "asc",
    ]);
  }

  const handlePostClick = (post) => {
    setHighlightedPostId(post.id);
    setHighlightedImage(post.image);
  };

  return (
    <Suspense fallback={null}>
      <main className="flex justify-end">
        <img
          id="post-image"
          src={highlightedImage}
          alt="Post Image"
          style={{ marginRight: "20px", position: "fixed", top: "60px", left: "20px", width: "50vw", height: "auto" }}
        />
        <div className="max-w-2xl font-jetbrains-bold mb-10 text-4xl text-right" style={{ marginLeft: "calc(50vw + 40px)" }}>
          <header className="text-gray-500 dark:text-gray-600 flex items-center text-xs">
            <button
              onClick={sortDate}
              className={`w-12 h-9 text-left  ${
                sort[0] === "date" && sort[1] !== "desc"
                  ? "text-gray-700 dark:text-gray-400"
                  : ""
              }`}
            >
              date
              {sort[0] === "date" && sort[1] === "asc" && "↑"}
            </button>
            <span className="grow pl-2">title</span>
            <button
              onClick={sortViews}
              className={`
                    h-9
                    pl-4
                    ${
                      sort[0] === "views"
                        ? "text-gray-700 dark:text-gray-400"
                        : ""
                    }
                  `}
            >
              views
              {sort[0] === "views" ? (sort[1] === "asc" ? "↑" : "↓") : ""}
            </button>
          </header>
          <List posts={posts} sort={sort} onPostClick={handlePostClick} highlightedPostId={highlightedPostId} />
        </div>
      </main>
    </Suspense>
  );
}

function List({ posts, sort, onPostClick, highlightedPostId }) {
  const sortedPosts = useMemo(() => {
    const [sortKey, sortDirection] = sort;
    return [...posts].sort((a, b) => {
      if (sortKey === "date") {
        return sortDirection === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return sortDirection === "desc" ? b.views - a.views : a.views - b.views;
      }
    });
  }, [posts, sort]);

  return (
    <ul>
      {sortedPosts.map((post, i: number) => {
        const year = getYear(post.date);
        const firstOfYear =
          !sortedPosts[i - 1] || getYear(sortedPosts[i - 1].date) !== year;
        const lastOfYear =
          !sortedPosts[i + 1] || getYear(sortedPosts[i + 1].date) !== year;

        return (
          <div key={post.id} onMouseEnter={() => onPostClick(post)}>
            <Link href={`/${new Date(post.date).getFullYear()}/${post.id}`}>
              <span
                className={`flex transition-[background-color] hover:bg-gray-100 dark:hover:bg-[#242424] active:bg-gray-200 dark:active:bg-[#222] border-y border-gray-200 dark:border-[#313131]
                ${!firstOfYear ? "border-t-0" : ""}
                ${lastOfYear ? "border-b-0" : ""}
                ${highlightedPostId === post.id ? "bg-yellow-200" : ""}
              `}
              >
                <span
                  className={`py-3 flex grow items-center ${
                    !firstOfYear ? "ml-14" : ""
                  }`}
                >
                  {firstOfYear && (
                    <span className="w-14 inline-block self-start shrink-0 text-gray-500 dark:text-gray-500">
                      {year}
                    </span>
                  )}

                  <div className="grow text-right">
                    <span className="text-gray-500 dark:text-gray-500 text-xs block">
                      [{post.viewsFormatted}]
                    </span>
                    <span className={`dark:text-orangered block ${jetBrainsMono.className}`}>{post.title}</span>
                  </div>
                </span>
              </span>
            </Link>
          </div>
        );
      })}
    </ul>
  );
}

function getYear(date: string) {
  return new Date(date).getFullYear();
}