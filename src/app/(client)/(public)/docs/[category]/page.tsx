
import React from "react";
import { CATEGORY_DOCS } from "@/lib/docs-data";
import DocCategoryClient from "./DocCategoryClient";

export function generateStaticParams() {
    return Object.keys(CATEGORY_DOCS).map((category) => ({
        category: category,
    }));
}

export default function DocCategoryPage() {
    return <DocCategoryClient />;
}
