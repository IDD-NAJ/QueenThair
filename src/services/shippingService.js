import supabase from '../lib/supabaseClient';

export const shippingService = {
  // Shipping Zones
  async getShippingZones(activeOnly = false) {
    let query = supabase
      .from('shipping_zones')
      .select(`
        *,
        rates:shipping_rates(*)
      `)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getShippingZone(id) {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select(`
        *,
        rates:shipping_rates(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createShippingZone(zoneData) {
    const { data, error } = await supabase
      .from('shipping_zones')
      .insert(zoneData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateShippingZone(id, updates) {
    const { data, error } = await supabase
      .from('shipping_zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteShippingZone(id) {
    const { error } = await supabase
      .from('shipping_zones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Shipping Rates
  async getShippingRates(zoneId = null) {
    let query = supabase
      .from('shipping_rates')
      .select(`
        *,
        zone:shipping_zones(*)
      `)
      .order('name', { ascending: true });

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createShippingRate(rateData) {
    const { data, error } = await supabase
      .from('shipping_rates')
      .insert(rateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateShippingRate(id, updates) {
    const { data, error } = await supabase
      .from('shipping_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteShippingRate(id) {
    const { error } = await supabase
      .from('shipping_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calculate shipping for order
  async calculateShipping(address, cartTotal) {
    const { country, state_region, postal_code } = address;

    // Find matching zone
    const zones = await this.getShippingZones(true);
    const matchingZone = zones.find(zone => {
      if (!zone.countries.includes(country)) return false;
      if (zone.states && zone.states.length > 0 && !zone.states.includes(state_region)) return false;
      if (zone.postal_codes && zone.postal_codes.length > 0) {
        const matches = zone.postal_codes.some(code => {
          if (code.includes('-')) {
            const [start, end] = code.split('-');
            return postal_code >= start && postal_code <= end;
          }
          return postal_code === code;
        });
        if (!matches) return false;
      }
      return true;
    });

    if (!matchingZone) {
      throw new Error('No shipping available for this location');
    }

    // Find applicable rate
    const applicableRates = matchingZone.rates.filter(rate => {
      if (!rate.is_active) return false;
      if (rate.min_order_amount && cartTotal < rate.min_order_amount) return false;
      if (rate.max_order_amount && cartTotal > rate.max_order_amount) return false;
      return true;
    });

    if (applicableRates.length === 0) {
      throw new Error('No shipping rates available for this order');
    }

    // Return all applicable rates
    return applicableRates.map(rate => ({
      id: rate.id,
      name: rate.name,
      description: rate.description,
      cost: rate.free_shipping_threshold && cartTotal >= rate.free_shipping_threshold 
        ? 0 
        : rate.base_rate,
      estimatedDays: rate.min_delivery_days && rate.max_delivery_days
        ? `${rate.min_delivery_days}-${rate.max_delivery_days} days`
        : null
    }));
  }
};

export default shippingService;
