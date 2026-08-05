"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
    type PermissionCheckResult,
} from "@nexus/contracts/permissions.types";
// FIXME (FIX-04): shared/hooks ne doit pas importer de module métier. Extraire policyEngine vers shared/nexus/contracts ou NexusEventBus.
 
 
import { policyEngine } from '@/modules/compliance/securite/PolicyEngine';

type ActionConfig = {
    minLevel: number;
    requiresPin?: boolean;
    limit?: number | string;
};

const ACTION_MAP: Record<string, Record<string, ActionConfig>> = {
    pos: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        open_table:            { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        add_product:           { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        send_to_kitchen:       { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        change_table:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        split_bill:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        merge_tables:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        apply_discount_percent:{ minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        apply_discount_amount: { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        offer_product:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cancel_item_sent:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        cancel_order:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cash_payment:          { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        card_payment:          { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        mixed_payment:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        refund:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        open_drawer:           { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        close_register:        { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        reprint_ticket:        { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        modify_price:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        add_tip:               { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        void_ticket:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        consumption_mode_toggle: { minLevel: PERMISSION_ROLE_LEVELS.serveur, requiresPin: false },
        tablet_mode_toggle:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    pos_mobile: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        open_table:            { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        add_product:           { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        send_to_kitchen:       { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        change_table:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        split_bill:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        merge_tables:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        apply_discount_percent:{ minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        apply_discount_amount: { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        offer_product:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cancel_item_sent:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        cancel_order:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cash_payment:          { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        card_payment:          { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        mixed_payment:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        refund:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        open_drawer:           { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        close_register:        { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        reprint_ticket:        { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        modify_price:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        add_tip:               { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        void_ticket:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        consumption_mode_toggle: { minLevel: PERMISSION_ROLE_LEVELS.serveur, requiresPin: false },
        tablet_mode_toggle:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    kds: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        mark_in_progress:      { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        mark_ready:            { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        recall:                { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        prioritize:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        cancel_from_kds:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        override_allergen:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        force_bump:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        view_history:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    kitchen: {
        view_recipes:          { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        view_recipe_details:   { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        create_recipe:         { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        modify_recipe:         { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        delete_recipe:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        view_cost:             { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        view_margin:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_price:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        add_ingredient:        { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        declare_waste:         { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        manage_prep_task:      { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        view_suppliers:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_allergens:      { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        export_recipes:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        print_fiche:           { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        edit_recipe:           { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        edit_margin:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        delete_product:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    bar: {
        view_orders:           { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        prepare:               { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        mark_ready:            { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        view_stock:            { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        adjust_stock:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        edit_cocktail:         { minLevel: PERMISSION_ROLE_LEVELS.barman,    requiresPin: false },
        adjust_cellar:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        view_cellar_value:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_wine_price:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
    },
    floor_plan: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.serveur,   requiresPin: false },
        change_status:         { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        assign_table:          { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        add_table:             { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        delete_table:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        move_table:            { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        resize_table:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_seats:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        create_zone:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        delete_zone:           { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        create_floor:          { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        delete_floor:          { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        apply_template:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        export_image:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        block_table:           { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    reservations: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        create:                { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        modify:                { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        cancel:                { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        confirm:               { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        mark_arrived:          { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        mark_noshow:           { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        assign_table:          { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        view_client_full:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        overbooking:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        send_reminder:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        create_group_quote:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        collect_deposit:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        apply_penalty:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        override_capacity:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        cancel_reservation:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    staff: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        view_employee:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        create_employee:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_employee:       { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        disable_employee:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        delete_employee:       { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        assign_role:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_salary:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        view_salaries:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_documents:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        reset_password:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        generate_pin:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        quick_add_staff:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        hire_candidate:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        publish_planning:      { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        approve_leave:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        reject_leave:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    planning: {
        view_own:              { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_team:             { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        create_shift:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        modify_shift:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        delete_shift:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        duplicate_week:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        publish:               { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        assign_employee:       { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        request_swap:          { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        approve_swap:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        print:                 { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    finance: {
        view_dashboard:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        view_ca_detail:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        view_margins:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        view_invoices:         { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        create_invoice:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        modify_invoice:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        cancel_invoice:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        send_invoice:          { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        mark_paid:             { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        view_suppliers:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        enter_expense:         { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        bank_reconciliation:   { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        bank_sync:             { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        close_period:          { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        safe_drop:             { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        petty_cash:            { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        tip_payout:            { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        close_day:             { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    haccp: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        record_temperature:    { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        validate_checklist:    { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        validate_control:      { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        report_nonconformity:  { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        close_nonconformity:   { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
        add_corrective_action: { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        view_history:          { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        export_registers:      { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
        export_pms:            { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: false },
        delete_lot:            { minLevel: PERMISSION_ROLE_LEVELS.manager,        requiresPin: true },
        force_override:        { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        quarantine_lot:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
    },
    inventory: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        add_stock:             { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        remove_stock:          { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        adjust_qty:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        declare_loss:          { minLevel: PERMISSION_ROLE_LEVELS.cuisinier, requiresPin: false },
        create_item:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_item:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        delete_item:           { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        view_valuation:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        create_order:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        validate_reception:    { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        view_history:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        physical_inventory:    { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        physical_count:        { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        move_stock:            { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        view_costs:            { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        manage_alerts:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        adjust_stock:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
    },
    crm: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        view_client:           { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        create_client:         { minLevel: PERMISSION_ROLE_LEVELS.hotesse,   requiresPin: false },
        modify_client:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        delete_client:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        merge_duplicates:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        add_note:              { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        add_tag:               { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        view_history_orders:   { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        view_ca_client:        { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        export_customers:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        import_customers:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        send_email:            { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        send_sms:              { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        send_campaign:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        edit_consent:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        adjust_loyalty_points: { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        erase_customer:        { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        delete_customer:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
    },
    marketing: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        create_campaign:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        publish_campaign:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        send_quote:            { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        manage_promotions:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        issue_giftcard:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        refund_giftcard:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        edit_seo:              { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_social_accounts:{ minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
    },
    analytics: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        view_predictions:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        compare_periods:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        filter:                { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        create_custom_report:  { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        schedule_report:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        trigger_vision_analysis: { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: false },
    },
    intelligence: {
        query_oracle:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        run_simulation:        { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        view_anomalies:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        export_report:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        configure_rag:         { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
    },
    menu_builder: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        edit_name:             { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        edit_allergens:        { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        add_photo:             { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        edit_price:            { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        edit_tax_rate:         { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        create_product:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        delete_product:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        publish_menu:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        export_menu:           { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
    },
    registre: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        create_entry:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        close_intervention:    { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        edit_duerp:            { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.comptable, requiresPin: false },
        generate_cerfa:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    timeclock: {
        clock_self:            { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: true }, // Own PIN
        view_own_history:      { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_team:             { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        edit_clocking:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        export_dsn:            { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        export_hours:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    recruitment: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        create_offer:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_candidates:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        advance_candidate:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        refuse_candidate:      { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        hire_candidate:        { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        delete_candidate:      { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        publish_offer:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    leaves: {
        view_own:              { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        request_leave:         { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        cancel_own_request:    { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_team_requests:    { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        approve_leave:         { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        reject_leave:          { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        modify_balance:        { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        export:                { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    operations: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.chef_cuisinier, requiresPin: false },
        force_table_release:   { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        acknowledge_alert:     { minLevel: PERMISSION_ROLE_LEVELS.chef_rang, requiresPin: false },
        trigger_emergency:     { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: true },
        view_financial_kpi:    { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
    },
    mon_espace: {
        view_own_schedule:     { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_own_payslips:     { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_own_timeclock:    { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        request_leave:         { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_own_tips:         { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        view_own_training:     { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
    },
    welcome_staff: {
        view_briefing:         { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
        checkin_service:       { minLevel: PERMISSION_ROLE_LEVELS.plongeur,  requiresPin: false },
    },
    migration: {
        view:                  { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        import_data:           { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        export_backup:         { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        validate_import:       { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
    },
    settings: {
        view_identity:         { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        modify_identity:       { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_roles:          { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        manage_users:          { minLevel: PERMISSION_ROLE_LEVELS.manager,   requiresPin: false },
        manage_integrations:   { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
        manage_security:       { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: true },
        manage_backups:        { minLevel: PERMISSION_ROLE_LEVELS.directeur, requiresPin: false },
    },
};

export function useActionPermission(page: string, action: string): PermissionCheckResult {
    const { currentUser } = useAuth();

    return useMemo<PermissionCheckResult>(() => {
        const config = ACTION_MAP[page]?.[action];

        // Action not declared → open to all authenticated users
        if (!config) return { allowed: true, requiresPin: false };

        if (!currentUser) return { allowed: false, requiresPin: false, reason: 'Non authentifié' };

        const role = currentUser.role as PermissionRole;
        const userLevel = PERMISSION_ROLE_LEVELS[role] ?? 0;

        if (userLevel >= config.minLevel) {
            return { allowed: true, requiresPin: config.requiresPin ?? false, limit: config.limit };
        }

        return {
            allowed: false,
            requiresPin: false,
            reason: `Niveau insuffisant — rôle ${role} (${userLevel}) < ${config.minLevel} requis`,
        };
    }, [currentUser, page, action]);
}

export function useThresholdCheck(page: string, action: string) {
    const { currentUser } = useAuth();

    const checkThreshold = useCallback(
        (field: 'amount' | 'discountPct' | 'quantity', value: number) => {
            if (!currentUser) return { allowed: false, reason: 'Non authentifié', requiresElevation: false };
            const role = currentUser.role as PermissionRole;
            const fullAction = `${page}.${action}`;
            return policyEngine.checkThreshold(role, fullAction, field, value);
        },
        [currentUser, page, action]
    );

    return { checkThreshold };
}
