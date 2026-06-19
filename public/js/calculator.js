// Yapay Zeka Vitrini — API Maliyet Hesaplayıcısı Scripti
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // Model Datasets
  const llmModels = [
    { name: 'GPT-4o', provider: 'OpenAI', inputPrice: 2.50, outputPrice: 10.00 },
    { name: 'GPT-4o-mini', provider: 'OpenAI', inputPrice: 0.15, outputPrice: 0.60 },
    { name: 'o1', provider: 'OpenAI', inputPrice: 15.00, outputPrice: 60.00 },
    { name: 'o3-mini', provider: 'OpenAI', inputPrice: 1.10, outputPrice: 4.40 },
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPrice: 3.00, outputPrice: 15.00 },
    { name: 'Claude 3.5 Haiku', provider: 'Anthropic', inputPrice: 0.80, outputPrice: 4.00 },
    { name: 'Claude 3 Opus', provider: 'Anthropic', inputPrice: 15.00, outputPrice: 75.00 },
    { name: 'Gemini 1.5 Pro', provider: 'Google', inputPrice: 1.25, outputPrice: 5.00 },
    { name: 'Gemini 1.5 Flash', provider: 'Google', inputPrice: 0.075, outputPrice: 0.30 },
    { name: 'Gemini 2.0 Flash', provider: 'Google', inputPrice: 0.075, outputPrice: 0.30 },
    { name: 'DeepSeek V3', provider: 'DeepSeek', inputPrice: 0.14, outputPrice: 0.28 },
    { name: 'DeepSeek R1', provider: 'DeepSeek', inputPrice: 0.55, outputPrice: 2.19 },
    { name: 'LLaMA 3.3 70B', provider: 'Groq', inputPrice: 0.59, outputPrice: 0.79 }
  ];

  const imageModels = [
    { name: 'DALL-E 3 (Standard)', provider: 'OpenAI', pricePerImage: 0.040 },
    { name: 'DALL-E 3 (HD)', provider: 'OpenAI', pricePerImage: 0.080 },
    { name: 'Flux.1 Schnell', provider: 'BFL (Flux)', pricePerImage: 0.003 },
    { name: 'Flux.1 Dev', provider: 'BFL (Flux)', pricePerImage: 0.030 },
    { name: 'Stable Diffusion 3.5', provider: 'Stability AI', pricePerImage: 0.065 },
    { name: 'Midjourney (Average)', provider: 'Midjourney', pricePerImage: 0.050 }
  ];

  // DOM Elements
  const tabLlm = document.getElementById('tab-llm');
  const tabImage = document.getElementById('tab-image');
  const llmInputsArea = document.getElementById('llm-inputs-area');
  const imageInputsArea = document.getElementById('image-inputs-area');

  const inputTokensSlider = document.getElementById('input-tokens-slider');
  const inputTokensNum = document.getElementById('input-tokens-num');
  const valInputTokens = document.getElementById('val-input-tokens');

  const outputTokensSlider = document.getElementById('output-tokens-slider');
  const outputTokensNum = document.getElementById('output-tokens-num');
  const valOutputTokens = document.getElementById('val-output-tokens');

  const requestsSlider = document.getElementById('requests-slider');
  const requestsNum = document.getElementById('requests-num');
  const valRequests = document.getElementById('val-requests');

  const imagesSlider = document.getElementById('images-slider');
  const imagesNum = document.getElementById('images-num');
  const valImages = document.getElementById('val-images');

  const exchangeRateInput = document.getElementById('exchange-rate-input');
  const pricingTbody = document.getElementById('pricing-tbody');

  let activeTabType = 'llm'; // 'llm' or 'image'

  // Tab switching
  tabLlm.addEventListener('click', function () {
    activeTabType = 'llm';
    tabLlm.classList.add('active');
    tabImage.classList.remove('active');
    llmInputsArea.style.display = 'block';
    imageInputsArea.style.display = 'none';
    calculateCosts();
  });

  tabImage.addEventListener('click', function () {
    activeTabType = 'image';
    tabImage.classList.add('active');
    tabLlm.classList.remove('active');
    llmInputsArea.style.display = 'none';
    imageInputsArea.style.display = 'block';
    calculateCosts();
  });

  // Sync Input Elements Helper
  function syncInputs(slider, numberInput, displayLabel, formatType = 'number') {
    function update(value) {
      let val = parseFloat(value);
      if (isNaN(val)) val = 0;
      
      slider.value = val;
      numberInput.value = val;
      
      if (formatType === 'number') {
        displayLabel.textContent = val.toLocaleString('tr-TR');
      } else {
        displayLabel.textContent = val;
      }
      calculateCosts();
    }

    slider.addEventListener('input', (e) => update(e.target.value));
    numberInput.addEventListener('input', (e) => update(e.target.value));
  }

  // Initialize synchronizations
  syncInputs(inputTokensSlider, inputTokensNum, valInputTokens);
  syncInputs(outputTokensSlider, outputTokensNum, valOutputTokens);
  syncInputs(requestsSlider, requestsNum, valRequests);
  syncInputs(imagesSlider, imagesNum, valImages);

  exchangeRateInput.addEventListener('input', calculateCosts);

  function calculateCosts() {
    const rate = parseFloat(exchangeRateInput.value) || 34.50;
    let results = [];

    if (activeTabType === 'llm') {
      const inputTokens = parseInt(inputTokensNum.value) || 0;
      const outputTokens = parseInt(outputTokensNum.value) || 0;
      const requests = parseInt(requestsNum.value) || 0;

      // Calculate cost per request and multiply by requests
      results = llmModels.map(model => {
        const inputCost = (inputTokens / 1000000) * model.inputPrice;
        const outputCost = (outputTokens / 1000000) * model.outputPrice;
        const totalUsd = (inputCost + outputCost) * requests;
        const totalTry = totalUsd * rate;
        return {
          name: model.name,
          provider: model.provider,
          usd: totalUsd,
          try: totalTry
        };
      });
    } else {
      const imageCount = parseInt(imagesNum.value) || 0;

      results = imageModels.map(model => {
        const totalUsd = imageCount * model.pricePerImage;
        const totalTry = totalUsd * rate;
        return {
          name: model.name,
          provider: model.provider,
          usd: totalUsd,
          try: totalTry
        };
      });
    }

    // Sort cheapest first
    results.sort((a, b) => a.usd - b.usd);

    renderResults(results);
  }

  function renderResults(results) {
    if (results.length === 0) {
      pricingTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Hesaplanamadı.</td></tr>';
      return;
    }

    pricingTbody.innerHTML = results.map((res, index) => {
      const isCheapest = index === 0;
      const rowClass = isCheapest ? 'class="cheapest"' : '';
      const badgeHtml = isCheapest ? '<span class="cheapest-badge">En Ucuz</span>' : '';

      const formattedTry = res.try.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedUsd = res.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return `
        <tr ${rowClass}>
          <td>
            <strong>${res.name}</strong> ${badgeHtml}
            <span class="model-provider">${res.provider}</span>
          </td>
          <td>
            <span class="cost-value-try">₺${formattedTry}</span>
          </td>
          <td>
            <span class="cost-value-usd">$${formattedUsd}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Initial Calculation
  calculateCosts();
});
