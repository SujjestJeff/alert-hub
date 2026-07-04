# Build stage: runs natively on the host CPU (no QEMU) to avoid esbuild/Go lfstack crashes
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY admin/package.json ./admin/
RUN npm install
COPY tsconfig.base.json ./
COPY admin ./admin
RUN npm run build -w admin

# Runtime stage: amd64 container for noVNC deployment
FROM jlesage/baseimage-gui:ubuntu-20.04-v4

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

WORKDIR /app

# Set application metadata via baseimage helper
RUN set-cont-env APP_NAME "Alert Hub" && \
    set-cont-env APP_VERSION "0.1.0"

# Install Chrome dependencies
RUN add-pkg \
    ca-certificates \
    libnss3 \
    gconf-service \
    libc6 \
    libcairo2 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0.0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcursor1 \
    libxext6 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libappindicator1 \
    gnupg2 \
    pulseaudio-utils \
    curl \
    wget \
    socat \
    alsa-base \
    alsa-utils \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    x11-xserver-utils \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    libsndfile1-dev \
    libxss1 \
    dbus \
    dbus-x11 \
    upower \
    git

### Support NVIDIA GPUs for graphics acceleration
RUN echo "/usr/local/nvidia/lib" >> /etc/ld.so.conf.d/nvidia.conf && \
    echo "/usr/local/nvidia/lib64" >> /etc/ld.so.conf.d/nvidia.conf

### Install Google Chrome
RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    add-pkg google-chrome-stable
RUN sed -i '/^SystemdService=/d' /usr/share/dbus-1/system-services/org.freedesktop.UPower.service && \
    dbus-uuidgen > /etc/machine-id

### Install Node.js 20 for static file serving at runtime
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    add-pkg nodejs && \
    npm install -g serve

### Copy pre-built admin SPA from build stage (avoids running esbuild under QEMU)
### startapp.sh serves /app/dist, so we place the admin build there
COPY --from=builder /app/admin/dist ./dist

### Copy container filesystem overlays (noVNC UI, NVIDIA config, PulseAudio config)
COPY rootfs/ /

ADD startapp.sh /startapp.sh
RUN chmod +x /startapp.sh
