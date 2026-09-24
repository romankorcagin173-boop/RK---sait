-- ============================================================================
-- Demo/test products so the catalogue isn't empty out of the box.
-- Safe to delete any time from the admin panel. Photos are placeholders —
-- replace them with real product photography from the admin panel.
-- Run after schema.sql.
-- ============================================================================

insert into public.products (
  category, slug, name, short_description, description, price, currency,
  images, is_active, sort_order, volume_ml, remaining_ml, aroma_notes
) values
(
  'parfum', 'rk-noir-01', 'RK Noir №01',
  'Тёмный древесно-пряный аромат для вечера.',
  'RK Noir №01 — плотный, тёмный аромат с дымным кедром и чёрным перцем в сердце и тёплой базой из амбры и ветивера. Создан небольшим тиражом, распив ведётся из одного нумерованного флакона.',
  3200, 'RUB',
  array['/brand/placeholders/parfum-1.svg'],
  true, 1, 100, 62, 'Верх: чёрный перец, бергамот. Сердце: дымный кедр, кожа. База: амбра, ветивер, мускус.'
),
(
  'parfum', 'rk-silver-02', 'RK Silver №02',
  'Чистый минералистичный аромат с холодным цитрусом.',
  'RK Silver №02 — светлый, почти прозрачный аромат: ледяной цитрус и вертикальный ирис поверх минералистичного мускуса. Для тех, кто выбирает сдержанность вместо громкости.',
  2900, 'RUB',
  array['/brand/placeholders/parfum-2.svg'],
  true, 2, 100, 88, 'Верх: бергамот, ледяной аккорд. Сердце: ирис, фиалка. База: белый мускус, кашемировое дерево.'
),
(
  'parfum', 'rk-rouge-03', 'RK Rouge №03',
  'Насыщенный ягодно-пряный аромат с кожаным шлейфом.',
  'RK Rouge №03 — концентрированный аромат для тех, кто хочет оставаться в комнате ещё долго после ухода: тёмные ягоды, шафран и мягкая кожа.',
  3600, 'RUB',
  array['/brand/placeholders/parfum-3.svg'],
  true, 3, 100, 41, 'Верх: шафран, чёрная смородина. Сердце: роза, специи. База: кожа, бензоин.'
);

insert into public.products (
  category, slug, name, short_description, description, price, currency,
  images, is_active, sort_order, material, dimensions, print_info
) values
(
  '3d_print', 'monolith-figure', 'Monolith Figure',
  'Скульптурная настольная фигура геометрической формы.',
  'Monolith Figure — авторская скульптурная форма, напечатанная на FDM-принтере инженерным пластиком с последующей матовой обработкой поверхности. Каждая копия проверяется вручную перед отправкой.',
  4500, 'RUB',
  array['/brand/placeholders/print-1.svg'],
  true, 1, 'PETG, матовое покрытие', '180 × 90 × 90 мм', 'Печать на профессиональном FDM-принтере, слой 0.12 мм, постобработка вручную.'
),
(
  '3d_print', 'rk-desk-organizer', 'RK Desk Organizer',
  'Модульный органайзер для рабочего стола.',
  'RK Desk Organizer — модульная система хранения мелочей на столе: подставка под телефон, отсек для ручек и карт. Печатается под заказ, доступна кастомизация цвета.',
  2800, 'RUB',
  array['/brand/placeholders/print-2.svg'],
  true, 2, 'PLA+ / ABS на выбор', '220 × 100 × 60 мм', 'Печать слоем 0.16–0.2 мм, укрепление стенок 4 периметра, заполнение 35%.'
),
(
  '3d_print', 'rk-lamp-shell', 'RK Lamp Shell',
  'Корпус настольного светильника с рассеивающей решёткой.',
  'RK Lamp Shell — корпус светильника с решётчатой структурой, рассеивающей тёплый свет LED-модуля. Продаётся как отдельная деталь под установку своего источника света.',
  5200, 'RUB',
  array['/brand/placeholders/print-3.svg'],
  true, 3, 'PETG (термостойкий)', '150 × 150 × 220 мм', 'Печать с поддержками по решётке, заполнение 20%, финальная шлифовка кромок.'
);

-- Demo of the per-volume pricing feature — a purchaser picks one of these
-- instead of buying at the flat price above. Edit/remove from the admin
-- panel like any other field.
update public.products
set volume_options = '[{"ml":3,"price":1200},{"ml":5,"price":1900},{"ml":10,"price":3400},{"ml":null,"price":18000}]'::jsonb
where slug = 'rk-noir-01';
