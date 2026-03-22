import supabase from '../lib/supabaseClient';

export const taxService = {
  async getTaxRates(filters = {}) {
    let query = supabase
      .from('tax_rates')
      .select('*')
      .order('priority', { ascending: true });

    if (filters.country) {
      query = query.eq('country', filters.country);
    }
    if (filters.state_region) {
      query = query.eq('state_region', filters.state_region);
    }
    if (filters.activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTaxRate(id) {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTaxRate(taxData) {
    const { data, error } = await supabase
      .from('tax_rates')
      .insert(taxData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaxRate(id, updates) {
    const { data, error } = await supabase
      .from('tax_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaxRate(id) {
    const { error } = await supabase
      .from('tax_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calculate tax for an order
  async calculateTax(address, subtotal, shippingCost = 0) {
    const { country, state_region, city, postal_code } = address;

    // Get applicable tax rates
    const rates = await this.getTaxRates({ 
      country, 
      state_region, 
      activeOnly: true 
    });

    if (rates.length === 0) {
      return {
        taxAmount: 0,
        taxRate: 0,
        breakdown: []
      };
    }

    // Filter by more specific location if available
    const applicableRates = rates.filter(rate => {
      if (rate.city && rate.city !== city) return false;
      if (rate.postal_code && rate.postal_code !== postal_code) return false;
      return true;
    });

    // Sort by priority
    const sortedRates = applicableRates.sort((a, b) => a.priority - b.priority);

    let totalTax = 0;
    const breakdown = [];

    for (const rate of sortedRates) {
      const taxableAmount = rate.shipping_taxable 
        ? subtotal + shippingCost 
        : subtotal;

      let taxAmount;
      if (rate.compound && totalTax > 0) {
        // Compound tax is calculated on subtotal + previous taxes
        taxAmount = (taxableAmount + totalTax) * (rate.rate / 100);
      } else {
        taxAmount = taxableAmount * (rate.rate / 100);
      }

      totalTax += taxAmount;
      breakdown.push({
        name: rate.name,
        rate: rate.rate,
        amount: taxAmount,
        compound: rate.compound
      });
    }

    return {
      taxAmount: Math.round(totalTax * 100) / 100,
      taxRate: sortedRates.reduce((sum, r) => sum + r.rate, 0),
      breakdown
    };
  }
};

export default taxService;
