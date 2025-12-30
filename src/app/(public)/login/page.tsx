import { Suspense } from 'react';
import { LoginForm } from '../login-form';
import { VideoBackground } from '../video-background';
import { ToastHandler } from '../toast-handler';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden">
      {/* Gradient Background - Fallback */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          background:
            'linear-gradient(180deg, #1E3A5F 0%, #2454FF 50%, #D4EEF7 100%)',
        }}
      />

      {/* Video Background */}
      <VideoBackground />

      {/* Subtle overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.05) 100%)',
        }}
      />

      {/* MEDVANTA Logo - Top Left */}
      <div className="absolute left-6 top-6 z-20">
        <Image
          src="/medvanta-text.png"
          alt="MEDVANTA"
          width={180}
          height={60}
          className="h-auto w-auto max-w-[180px] object-contain"
          style={{ display: 'block' }}
          loading="eager"
        />
      </div>

      {/* Toast Handler */}
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>

      {/* Login Card - Centered */}
      <div className="relative z-10 flex h-full items-center justify-center p-6">
        <div className="relative h-[380px] w-[380px] shrink-0 overflow-hidden rounded-full">
          <svg
            width="380"
            height="380"
            viewBox="0 0 438 438"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 h-[380px] w-[380px]"
          >
            <foreignObject x="-22" y="-22" width="482" height="482">
              <div
                style={{
                  backdropFilter: 'blur(9px)',
                  clipPath: 'url(#bgblur_login_card_clip_path)',
                  height: '100%',
                  width: '100%',
                }}
              />
            </foreignObject>
            <g filter="url(#filter0_ii_login_card)">
              <path
                d="M0.605 219.01C0.605 98.388246 98.388246 0.605 219.01 0.605C339.63127 0.605 437.415 98.388246 437.415 219.01C437.415 339.63127 339.63127 437.415 219.01 437.415C98.388246 437.415 0.605 339.63127 0.605 219.01Z"
                fill="white"
                fillOpacity="0.12"
              />
              <path
                d="M219.01 0.3025C339.79825 0.3025 437.7175 98.221145 437.7175 219.01C437.7175 339.79825 339.79825 437.7175 219.01 437.7175C98.221145 437.7175 0.3025 339.79825 0.3025 219.01C0.3025 98.221145 98.221145 0.3025 219.01 0.3025Z"
                stroke="url(#paint0_linear_login_card)"
                strokeWidth="0.605"
              />
            </g>
            <defs>
              <filter
                id="filter0_ii_login_card"
                x="-22"
                y="-22"
                width="482"
                height="482"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="2" />
                <feComposite
                  in2="hardAlpha"
                  operator="arithmetic"
                  k2="-1"
                  k3="1"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0"
                />
                <feBlend
                  mode="normal"
                  in2="shape"
                  result="effect1_innerShadow_login_card"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="-2" />
                <feGaussianBlur stdDeviation="2" />
                <feComposite
                  in2="hardAlpha"
                  operator="arithmetic"
                  k2="-1"
                  k3="1"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                />
                <feBlend
                  mode="normal"
                  in2="effect1_innerShadow_login_card"
                  result="effect2_innerShadow_login_card"
                />
              </filter>
              <clipPath
                id="bgblur_login_card_clip_path"
                transform="translate(22 22)"
              >
                <path d="M0.605 219.01C0.605 98.388246 98.388246 0.605 219.01 0.605C339.63127 0.605 437.415 98.388246 437.415 219.01C437.415 339.63127 339.63127 437.415 219.01 437.415C98.388246 437.415 0.605 339.63127 0.605 219.01Z" />
              </clipPath>
              <linearGradient
                id="paint0_linear_login_card"
                x1="26.126562"
                y1="400.74353"
                x2="423.77346"
                y2="46.874069"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.06" />
                <stop offset="0.475962" stopColor="white" />
                <stop offset="0.947115" stopColor="white" stopOpacity="0.06" />
              </linearGradient>
            </defs>
          </svg>

          {/* Content */}
          <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
            <div className="w-full">
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
