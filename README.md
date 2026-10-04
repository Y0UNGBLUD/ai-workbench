# AI Workbench

AI 문서 분석 및 질의응답 기능을 구현한 프론트엔드 프로젝트입니다.

PDF 문서 조회부터 AI 분석 결과의 실시간 스트리밍, Markdown 렌더링, 각주를 통한 PDF 원문 위치 연동까지의 사용자 흐름을 구현했습니다.

## 🚀 Getting Started

```bash
npm install
npm run dev:mock
```

MSW를 사용하여 백엔드 API 없이 주요 기능을 확인할 수 있습니다.

## ✨ Features

- 로그인 및 아이디 저장
- 문서 목록 및 상세 조회
- PDF Viewer
- AI 문서 분석
- SSE 기반 실시간 분석 결과 처리
- Markdown 렌더링 및 목차(TOC) 생성
- 분석 결과 각주와 PDF 원문 위치 연동
- 문서 기반 Chat UI
- PDF / 분석 결과 / Chat 3-column Workspace
- 패널 크기 조절

## 🛠️ Tech Stack

- Vue 3
- TypeScript
- Vite
- Quasar
- Pinia
- Sass
- PDF.js
- Marked
- DOMPurify
- MSW

## 🔄 Document Analysis Flow

```text
문서 선택
  ↓
PDF 조회
  ↓
분석 요청
  ↓
SSE Stream
  ↓
분석 결과 수신
  ↓
Markdown 처리
  ↓
분석 결과 렌더링
  ↓
각주 클릭
  ↓
PDF 원문 위치 이동
```

## 📌 Project Scope

**AI 문서 분석 서비스의 프론트엔드 사용자 경험과 데이터 처리 흐름 구현**에 집중한 프로젝트입니다.
